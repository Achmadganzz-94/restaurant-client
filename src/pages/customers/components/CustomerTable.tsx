interface Membership {
  id: string;
  memberCode: string;
  discountPercent: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string | null;
  points: number;
  createdAt: string;
  membership?: Membership | null;
}

interface CustomerTableProps {
  customers: Customer[];
  loading: boolean;
  onDetail: (customer: Customer) => void;
}

export default function CustomerTable({
  customers,
  loading,
  onDetail,
}: CustomerTableProps) {
  if (loading) {
    return (
      <div className="p-10 text-center text-sm text-slate-500">
        Memuat data customer...
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="p-10 text-center text-sm text-slate-500">
        Belum ada customer.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left px-6 py-4 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              Customer
            </th>

            <th className="text-left px-6 py-4 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              Email
            </th>

            <th className="text-left px-6 py-4 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              Telepon
            </th>

            <th className="text-left px-6 py-4 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              Membership
            </th>

            <th className="text-left px-6 py-4 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              Terdaftar
            </th>

            <th className="text-right px-6 py-4 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              Aksi
            </th>
          </tr>
        </thead>

        <tbody>
          {customers.map((customer) => (
            <tr
              key={customer.id}
              className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition"
            >
              <td className="px-6 py-4">
                <p className="text-sm font-bold text-slate-800">
                  {customer.name}
                </p>

                <p className="text-[10px] text-slate-400 mt-1">
                  ID: {customer.id.slice(0, 8)}...
                </p>
              </td>

              <td className="px-6 py-4">
                <span className="text-xs text-slate-600">
                  {customer.email || "-"}
                </span>
              </td>

              <td className="px-6 py-4">
                <span className="text-xs text-slate-600">
                  {customer.phone || "-"}
                </span>
              </td>

              <td className="px-6 py-4">
                {customer.membership ? (
                  <div>
                    <span className="inline-flex px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[9px] font-extrabold">
                      MEMBER
                    </span>

                    <p className="text-[10px] text-slate-500 mt-1">
                      {customer.membership.memberCode} •{" "}
                      {customer.membership.discountPercent}% diskon
                    </p>
                  </div>
                ) : (
                  <span className="inline-flex px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-200 text-[9px] font-extrabold">
                    NON-MEMBER
                  </span>
                )}
              </td>

              <td className="px-6 py-4">
                <span className="text-xs text-slate-600">
                  {new Date(customer.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </td>

              <td className="px-6 py-4 text-right">
                <button
                  type="button"
                  onClick={() => onDetail(customer)}
                  className="px-3 py-2 rounded-lg text-xs font-bold border text-blue-600 hover:bg-blue-400 transition"
                >
                  Detail
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

