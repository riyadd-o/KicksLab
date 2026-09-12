/**
 * Chapa Payment & Refund Gateway Service
 * Handles server-side interactions with Chapa's official API in Test and Live modes.
 */

export interface ChapaTransactionVerifyResult {
  success: boolean;
  status?: string;
  chapaReference?: string;
  amount?: number;
  currency?: string;
  message?: string;
  raw?: any;
}

export interface ChapaRefundInitiateParams {
  tx_ref: string;
  chapa_reference?: string | null;
  amount: number;
  reason: string;
}

export interface ChapaRefundInitiateResult {
  success: boolean;
  ref_id?: string;
  status?: string; // e.g. "initiated", "processing", "refunded", "failed"
  chapa_reference?: string;
  message?: string;
  raw?: any;
}

export interface ChapaRefundVerifyResult {
  success: boolean;
  status?: string; // e.g. "initiated", "processing", "refunded", "reversed", "failed"
  ref_id?: string;
  amount?: number;
  message?: string;
  raw?: any;
}

function getChapaSecretKey(): string {
  const secretKey = process.env.CHAPA_SECRET_KEY;
  if (!secretKey) {
    throw new Error("CHAPA_SECRET_KEY is not configured in server environment variables.");
  }
  return secretKey;
}

/**
 * 1. Verify an existing Chapa transaction using its merchant tx_ref or reference.
 * GET https://api.chapa.co/v1/transaction/verify/:tx_ref
 */
export async function verifyChapaTransaction(tx_ref: string): Promise<ChapaTransactionVerifyResult> {
  const secretKey = getChapaSecretKey();

  if (!tx_ref || !tx_ref.trim()) {
    return {
      success: false,
      message: "Transaction reference (tx_ref) is required for verification.",
    };
  }

  const cleanTxRef = tx_ref.trim();
  const url = `https://api.chapa.co/v1/transaction/verify/${encodeURIComponent(cleanTxRef)}`;

  console.log(`[Chapa Verify] Querying: GET ${url}`);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    const contentType = res.headers.get("content-type") || "";
    let data: any = {};
    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = { message: text };
    }

    console.log(`[Chapa Verify Response] HTTP ${res.status}:`, data);

    if (!res.ok || data?.status !== "success" || !data?.data) {
      return {
        success: false,
        status: data?.status || "failed",
        message: typeof data?.message === "string" ? data.message : "Transaction verification failed.",
        raw: data,
      };
    }

    const chapaReference =
      data.data.reference ||
      data.data.chapa_reference ||
      data.data.ref_id ||
      data.data.id ||
      null;

    return {
      success: true,
      status: data.data.status || "success",
      chapaReference: chapaReference ? String(chapaReference) : undefined,
      amount: data.data.amount ? Number(data.data.amount) : undefined,
      currency: data.data.currency,
      message: data.message || "Transaction verified successfully",
      raw: data,
    };
  } catch (error: any) {
    console.error(`[Chapa Verify Exception]`, error);
    return {
      success: false,
      message: error.message || "Failed to communicate with Chapa transaction verify API.",
    };
  }
}

/**
 * 2. Initiates a refund for an existing transaction via Chapa API.
 * Performs transaction verification first to obtain Chapa's official reference,
 * then posts to POST https://api.chapa.co/v1/refund/:reference
 */
export async function initiateChapaRefund({
  tx_ref,
  chapa_reference,
  amount,
  reason,
}: ChapaRefundInitiateParams): Promise<ChapaRefundInitiateResult> {
  const secretKey = getChapaSecretKey();

  if (!tx_ref || !tx_ref.trim()) {
    return {
      success: false,
      message: "Original Chapa transaction reference (tx_ref) is required.",
    };
  }

  const cleanTxRef = tx_ref.trim();

  // Step A: Verify transaction exists on Chapa before attempting refund
  let targetReference = chapa_reference ? chapa_reference.trim() : null;

  console.log(`[Chapa Refund] Pre-verifying transaction for tx_ref: ${cleanTxRef}`);
  const verifyRes = await verifyChapaTransaction(cleanTxRef);

  if (!verifyRes.success) {
    console.warn(`[Chapa Refund] Transaction pre-verification failed for ${cleanTxRef}:`, verifyRes.message);
    return {
      success: false,
      status: "failed",
      message: "The original Chapa transaction could not be found. The stored payment reference does not match the Chapa transaction.",
      raw: verifyRes.raw,
    };
  }

  // Use Chapa's official transaction reference if discovered from verification
  if (verifyRes.chapaReference) {
    targetReference = verifyRes.chapaReference;
  } else if (!targetReference) {
    targetReference = cleanTxRef;
  }

  // If the transaction has already reached 'refunded' status on Chapa, return success with processing status so approval flow proceeds cleanly
  if (verifyRes.status === "refunded") {
    console.log(`[Chapa Refund] Transaction ${cleanTxRef} (${targetReference}) is confirmed on Chapa.`);
    return {
      success: true,
      status: "processing",
      ref_id: verifyRes.chapaReference || targetReference,
      chapa_reference: targetReference,
      message: "Transaction verified on Chapa gateway.",
      raw: verifyRes.raw,
    };
  }

  // Step B: Call Chapa Refund endpoint with Chapa's reference
  const url = `https://api.chapa.co/v1/refund/${encodeURIComponent(targetReference)}`;
  console.log(`[Chapa Refund] Initiating refund via POST ${url} for targetReference: ${targetReference}, amount: ETB ${amount}`);

  try {
    const payload = {
      amount: amount.toString(),
      reason: reason || "Customer refund request",
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const contentType = res.headers.get("content-type") || "";
    let data: any = {};
    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const text = await res.text();
      console.warn(`[Chapa Refund Warning] Non-JSON response from Chapa API:`, text);
      data = { message: text };
    }

    console.log(`[Chapa Refund Response] HTTP ${res.status}:`, data);

    const isSuccess = data?.status === "success" || data?.status === "initiated" || (res.ok && res.status < 300);
    const ref_id =
      data?.data?.ref_id ||
      data?.data?.reference ||
      data?.data?.refund_ref ||
      data?.data?.id ||
      data?.ref_id ||
      data?.reference;

    const refundStatus = (data?.data?.status || data?.status || (isSuccess ? "initiated" : "failed")).toLowerCase();

    if (!isSuccess && !ref_id) {
      const errMsg = typeof data?.message === "string" ? data.message : "Chapa refund request was rejected.";
      return {
        success: false,
        status: "failed",
        message: errMsg,
        raw: data,
      };
    }

    return {
      success: true,
      ref_id: ref_id ? String(ref_id) : undefined,
      chapa_reference: targetReference,
      status: refundStatus,
      message: data?.message || "Refund initiated successfully",
      raw: data,
    };
  } catch (error: any) {
    console.error(`[Chapa Refund API Exception]`, error);
    return {
      success: false,
      status: "failed",
      message: error.message || "Failed to communicate with Chapa Refund API.",
    };
  }
}

/**
 * 3. Verifies the status of a Chapa refund using Chapa's refund verification endpoint.
 * GET https://api.chapa.co/v1/refund/:ref_id/verify
 */
export async function verifyChapaRefund(ref_id: string): Promise<ChapaRefundVerifyResult> {
  const secretKey = getChapaSecretKey();

  if (!ref_id || !ref_id.trim()) {
    return {
      success: false,
      message: "Chapa refund reference (ref_id) is required.",
    };
  }

  const cleanRef = ref_id.trim();
  const url = `https://api.chapa.co/v1/refund/${encodeURIComponent(cleanRef)}/verify`;

  console.log(`[Chapa Refund Verify] Querying: GET ${url}`);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    const contentType = res.headers.get("content-type") || "";
    let data: any = {};
    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = { message: text };
    }

    console.log(`[Chapa Refund Verify Response] HTTP ${res.status}:`, data);

    if (!res.ok || data?.status !== "success" || !data?.data) {
      return {
        success: false,
        status: data?.status || "failed",
        message: typeof data?.message === "string" ? data.message : "Chapa refund verification failed.",
        raw: data,
      };
    }

    const returnStatus = (data.data.status || "processing").toLowerCase();

    return {
      success: true,
      status: returnStatus,
      ref_id: data.data.ref_id || cleanRef,
      amount: data.data.amount ? Number(data.data.amount) : undefined,
      message: data.message || "Refund verified successfully",
      raw: data,
    };
  } catch (error: any) {
    console.error(`[Chapa Refund Verify Exception]`, error);
    return {
      success: false,
      status: "failed",
      message: error.message || "Failed to communicate with Chapa Refund Verification API.",
    };
  }
}
