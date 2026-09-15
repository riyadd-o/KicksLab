'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, ShieldCheck, ChevronDown, Clock, HelpCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: 'How does delivery work in Addis Ababa and across Ethiopia?',
    answer: 'We provide prompt express delivery within Addis Ababa and Dire Dawa (often same-day or next-day). For all other regions across Ethiopia, delivery is handled via our regional transit partners with fees confirmed prior to dispatch.',
  },
  {
    question: 'How do I check the real-time status of my order?',
    answer: 'You can track your order at any time using our dedicated Track Order portal. Simply enter your Order Number (e.g., KL-854680) and email address to view live packing, shipping, and delivery updates.',
  },
  {
    question: "What is KicksLab's return and refund policy?",
    answer: 'We prioritize customer satisfaction. If an item is defective, damaged, or incorrect, you can request an exchange or full refund within 7 days of delivery directly through our Track Order & Refund portal.',
  },
  {
    question: 'Are all sneakers 100% authentic?',
    answer: 'Yes, absolutely. Every pair in our inventory goes through a strict multi-point authenticity inspection by our sneaker specialists before being packed and dispatched.',
  },
  {
    question: 'Which payment methods do you support?',
    answer: 'We accept secure instant payments via Telebirr, CBE Birr, and E-Birr, as well as Cash on Delivery upon checkout.',
  },
];

export default function ContactPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="bg-[#0D0D0D] min-h-screen pt-12 pb-24 text-[#F5F0E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-[#C9A96E] bg-[#C9A96E]/10 border border-[#C9A96E]/20 px-3 py-1 rounded-full inline-block mb-3">
            Direct Assistance
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#F5F0E8] mb-4">
            Contact <span className="text-[#C9A96E]">KicksLab</span>
          </h1>
          <p className="text-[#A89880] text-sm md:text-base leading-relaxed">
            We are here to help. Reach out directly using our official contact channels or explore answers to common inquiries below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Direct Contact Information (5 cols) */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-6 sm:p-8 space-y-6">
              <h2 className="text-xl font-serif font-bold text-[#F5F0E8] border-b border-[#2A2420] pb-4">
                Contact Information
              </h2>

              <div className="space-y-6">
                {/* Email Us */}
                <div className="flex items-start gap-4">
                  <div className="bg-[#1A1A1A] p-3 rounded-xl border border-[#2A2420] shrink-0 text-[#C9A96E]">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#F5F0E8] uppercase tracking-wide">Email Us</h3>
                    <p className="text-[#A89880] text-xs mt-0.5">Reach our support desk directly</p>
                    <a
                      href="mailto:info@kickslab.com"
                      className="text-[#C9A96E] font-semibold text-sm hover:underline mt-1.5 inline-block"
                    >
                      info@kickslab.com
                    </a>
                  </div>
                </div>

                {/* Call Us */}
                <div className="flex items-start gap-4">
                  <div className="bg-[#1A1A1A] p-3 rounded-xl border border-[#2A2420] shrink-0 text-[#C9A96E]">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#F5F0E8] uppercase tracking-wide">Call Us</h3>
                    <p className="text-[#A89880] text-xs mt-0.5">Customer line Mon–Sat from 8:30am to 7:30pm</p>
                    <a
                      href="tel:0991289526"
                      className="text-[#C9A96E] font-semibold text-sm hover:underline mt-1.5 inline-block font-mono"
                    >
                      09-91-28-95-26
                    </a>
                  </div>
                </div>

                {/* Visit Us */}
                <div className="flex items-start gap-4">
                  <div className="bg-[#1A1A1A] p-3 rounded-xl border border-[#2A2420] shrink-0 text-[#C9A96E]">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#F5F0E8] uppercase tracking-wide">Visit Us</h3>
                    <p className="text-[#A89880] text-xs mt-0.5">Visit our store showrooms & HQ</p>
                    <p className="text-[#F5F0E8] font-medium text-sm mt-1.5">
                      Dire Dawa & Addis Ababa, Ethiopia
                    </p>
                  </div>
                </div>

                {/* Business Hours */}
                <div className="flex items-start gap-4">
                  <div className="bg-[#1A1A1A] p-3 rounded-xl border border-[#2A2420] shrink-0 text-[#C9A96E]">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#F5F0E8] uppercase tracking-wide">Working Hours</h3>
                    <p className="text-[#F5F0E8] text-sm mt-1.5 font-medium">
                      Monday – Saturday: 8:30 AM – 7:30 PM
                    </p>
                    <p className="text-[#A89880] text-xs mt-0.5">Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Tracking & Refunds Action Card */}
            <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-3 text-[#C9A96E]">
                <ShieldCheck className="h-6 w-6" />
                <h3 className="text-[#F5F0E8] font-serif text-lg font-bold">Order Status & Refunds</h3>
              </div>
              <p className="text-[#A89880] text-xs sm:text-sm leading-relaxed">
                Need real-time tracking on your package or want to submit an order return? Access our dedicated self-service portal anytime.
              </p>
              <Link
                href="/track-order"
                className="inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#b5955a] text-[#0D0D0D] font-bold px-5 py-3 rounded-xl text-xs uppercase tracking-wider transition-colors font-sans mt-2"
              >
                Track Order & Refunds <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Right Column: Frequently Asked Questions (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#141414] border border-[#2A2420] rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#2A2420]">
                <HelpCircle className="h-6 w-6 text-[#C9A96E]" />
                <div>
                  <h2 className="text-xl font-serif font-bold text-[#F5F0E8]">
                    Frequently Asked Questions
                  </h2>
                  <p className="text-xs text-[#A89880] mt-0.5">
                    Quick answers to the most common inquiries from our customers
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {FAQS.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={idx}
                      className="border border-[#2A2420] rounded-xl overflow-hidden bg-[#0D0D0D] transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => toggleFaq(idx)}
                        className="w-full flex items-center justify-between gap-4 p-4 text-left cursor-pointer hover:bg-[#1A1A1A]/60 transition-colors"
                        aria-expanded={isOpen}
                      >
                        <span className="text-sm font-semibold text-[#F5F0E8] pr-2">
                          {faq.question}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-[#C9A96E] shrink-0 transition-transform duration-200 ${
                            isOpen ? 'transform rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-[#A89880] leading-relaxed border-t border-[#2A2420]/60">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 pt-6 border-t border-[#2A2420] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A89880]">
                <p>Have a different question?</p>
                <a
                  href="mailto:info@kickslab.com"
                  className="text-[#C9A96E] hover:underline font-bold uppercase tracking-wider inline-flex items-center gap-1.5"
                >
                  Write to info@kickslab.com <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
