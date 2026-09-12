export default function SizeGuidePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8 text-[#F5F0E8]">
      <h1 className="font-serif text-4xl font-bold text-[#F5F0E8] mb-8 text-center">Size Guide</h1>
      <p className="font-sans text-[#A89880] text-center mb-12 max-w-2xl mx-auto">
        Find your perfect fit. Our shoes are true to size. If you are between sizes, we recommend sizing up for closed-toe styles and sizing down for sandals.
      </p>
      <div className="overflow-x-auto rounded-lg border border-[#2A2420]">
        <table className="w-full text-left text-sm text-[#A89880] font-sans">
          <thead className="bg-[#141414] text-xs uppercase text-[#F5F0E8] border-b border-[#2A2420]">
            <tr>
              <th scope="col" className="px-6 py-4 font-bold">EU Size</th>
              <th scope="col" className="px-6 py-4 font-bold">US Size (Men)</th>
              <th scope="col" className="px-6 py-4 font-bold">US Size (Women)</th>
              <th scope="col" className="px-6 py-4 font-bold">UK Size</th>
              <th scope="col" className="px-6 py-4 font-bold">Foot Length (cm)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-[#0D0D0D]">
            {[
              { eu: 36, usm: '-', usw: '5', uk: '3', cm: '22.5' },
              { eu: 37, usm: '-', usw: '6', uk: '4', cm: '23.5' },
              { eu: 38, usm: '5', usw: '7', uk: '5', cm: '24.5' },
              { eu: 39, usm: '6', usw: '8', uk: '6', cm: '25.0' },
              { eu: 40, usm: '7', usw: '9', uk: '6.5', cm: '25.5' },
              { eu: 41, usm: '8', usw: '10', uk: '7.5', cm: '26.5' },
              { eu: 42, usm: '9', usw: '11', uk: '8.5', cm: '27.0' },
              { eu: 43, usm: '10', usw: '-', uk: '9.5', cm: '28.0' },
              { eu: 44, usm: '11', usw: '-', uk: '10.5', cm: '28.5' },
              { eu: 45, usm: '12', usw: '-', uk: '11.5', cm: '29.5' },
              { eu: 46, usm: '13', usw: '-', uk: '12', cm: '30.0' },
            ].map((row) => (
              <tr key={row.eu} className="hover:bg-[#141414]/50 transition-colors">
                <td className="px-6 py-4 font-bold text-[#C9A96E]">{row.eu}</td>
                <td className="px-6 py-4">{row.usm}</td>
                <td className="px-6 py-4">{row.usw}</td>
                <td className="px-6 py-4">{row.uk}</td>
                <td className="px-6 py-4">{row.cm} cm</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
