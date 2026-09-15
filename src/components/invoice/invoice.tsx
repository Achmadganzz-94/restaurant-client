import type { ReactNode } from "react";

interface InvoiceProps {
  order: any;
  onClose?: () => void;
}

const formatRupiah = (value: number | string | null | undefined) => {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
};

const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ReceiptRow = ({
  label,
  value,
  bold = false,
  className = "",
}: {
  label: string;
  value: ReactNode;
  bold?: boolean;
  className?: string;
}) => {
  return (
    <div
      className={`receipt-row ${
        bold ? "font-bold" : ""
      } ${className}`}
    >
      <span>{label}</span>

      <span className="text-right">{value}</span>
    </div>
  );
};

export default function Invoice({ order, onClose }: InvoiceProps) {
  if (!order) return null;

  const subtotal = Number(order.subtotal || 0);
  const discount = Number(order.discount || 0);
  const tax = Number(order.tax || 0);
  const serviceCharge = Number(order.serviceCharge || 0);
  const total = Number(order.totalPrice || 0);

  const payment = order.payment || null;

  const paid = Number(payment?.payAmount || 0);
  const change = Number(payment?.changeAmount || 0);

  const customer = order.customer || null;
  const membership = customer?.membership || null;

  const isMember = Boolean(membership);

  const orderItems = Array.isArray(order.orderItems)
    ? order.orderItems
    : [];

  const invoiceNumber = order.orderNumber
    ? `INV-${order.orderNumber}`
    : "INV-ORDER";

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* =====================================================
          SCREEN PREVIEW
      ===================================================== */}

      <div
        className="fixed inset-0 z-100 bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto print:hidden"
        onClick={onClose}
      >
        <div
          className="min-h-full flex items-center justify-center py-6"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="w-full max-w-md">
            {/* ACTION BAR */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-400">
                  Receipt
                </p>

                <h2 className="text-lg font-extrabold text-white mt-1">
                  {invoiceNumber}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg transition"
                >
                  🖨 Cetak
                </button>

                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg transition"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* =================================================
                THERMAL RECEIPT PREVIEW
            ================================================= */}

            <div className="receipt-preview bg-white shadow-2xl mx-auto">
              {/* HEADER */}
              <div className="receipt-header">
                <h1>RESTAURANT</h1>

                <p>Restaurant Order Management</p>

                <div className="receipt-divider">
                  ==================================
                </div>

                <h2>STRUK PEMBAYARAN</h2>

                <p className="receipt-invoice">
                  {invoiceNumber}
                </p>

                <p>{formatDate(order.createdAt)}</p>
              </div>

              {/* CUSTOMER */}
              <div className="receipt-section">
                <ReceiptRow
                  label="Customer"
                  value={customer?.name || "Walk-in"}
                />

                <ReceiptRow
                  label="Tipe"
                  value={order.orderType || "-"}
                />

                {order.tableNumber && (
                  <ReceiptRow
                    label="Meja"
                    value={order.tableNumber}
                  />
                )}

                <ReceiptRow
                  label="Status"
                  value={
                    isMember
                      ? "MEMBER"
                      : "WALK-IN"
                  }
                />

                {isMember && membership?.memberCode && (
                  <ReceiptRow
                    label="Member"
                    value={membership.memberCode}
                  />
                )}
              </div>

              {/* ITEM */}
              <div className="receipt-section">
                <p className="receipt-title">
                  PESANAN
                </p>

                {orderItems.length > 0 ? (
                  orderItems.map(
                    (item: any, index: number) => {
                      const itemPrice = Number(
                        item.price || 0,
                      );

                      const quantity = Number(
                        item.quantity || 0,
                      );

                      const itemTotal =
                        itemPrice * quantity;

                      return (
                        <div
                          key={item.id || index}
                          className="receipt-item"
                        >
                          <div className="receipt-item-name">
                            {index + 1}.{" "}
                            {item.menuItem?.name ||
                              "Menu"}
                          </div>

                          <div className="receipt-item-detail">
                            <span>
                              {quantity} x{" "}
                              {formatRupiah(
                                itemPrice,
                              )}
                            </span>

                            <span>
                              {formatRupiah(
                                itemTotal,
                              )}
                            </span>
                          </div>

                          {item.notes && (
                            <div className="receipt-note">
                              Catatan: {item.notes}
                            </div>
                          )}
                        </div>
                      );
                    },
                  )
                ) : (
                  <p className="receipt-empty">
                    Tidak ada item.
                  </p>
                )}
              </div>

              {/* TOTAL */}
              <div className="receipt-section">
                <ReceiptRow
                  label="Subtotal"
                  value={formatRupiah(subtotal)}
                />

                {tax > 0 && (
                  <ReceiptRow
                    label="Tax"
                    value={formatRupiah(tax)}
                  />
                )}

                {serviceCharge > 0 && (
                  <ReceiptRow
                    label="Service"
                    value={formatRupiah(
                      serviceCharge,
                    )}
                  />
                )}

                {discount > 0 && (
                  <ReceiptRow
                    label="Diskon Member"
                    value={`- ${formatRupiah(
                      discount,
                    )}`}
                    className="text-red-600"
                  />
                )}

                <div className="receipt-divider">
                  ----------------------------------
                </div>

                <div className="receipt-total">
                  <span>TOTAL</span>

                  <span>
                    {formatRupiah(total)}
                  </span>
                </div>
              </div>

              {/* PAYMENT */}
              {payment && (
                <div className="receipt-section">
                  <p className="receipt-title">
                    PEMBAYARAN
                  </p>

                  <ReceiptRow
                    label="Metode"
                    value={payment.method || "-"}
                  />

                  <ReceiptRow
                    label="Tagihan"
                    value={formatRupiah(total)}
                  />

                  <ReceiptRow
                    label="Dibayar"
                    value={formatRupiah(paid)}
                  />

                  <ReceiptRow
                    label="Kembalian"
                    value={formatRupiah(change)}
                    className="text-emerald-600"
                  />

                  <div className="receipt-paid">
                    PEMBAYARAN BERHASIL
                  </div>
                </div>
              )}

              {/* FOOTER */}
              <div className="receipt-footer">
                <div className="receipt-divider">
                  ==================================
                </div>

                <strong>TERIMA KASIH ❤️</strong>

                <p>
                  Selamat menikmati makanan Anda.
                </p>

                <p>
                  Simpan struk ini sebagai bukti
                  pembayaran.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          PRINT RECEIPT
      ===================================================== */}

      <div className="thermal-print">
        <div className="thermal-receipt">
          {/* HEADER */}
          <div className="thermal-header">
            <h1>RESTAURANT</h1>

            <p>
              Restaurant Order Management
            </p>

            <div className="thermal-divider">
              ==================================
            </div>

            <strong>STRUK PEMBAYARAN</strong>

            <p>{invoiceNumber}</p>

            <p>{formatDate(order.createdAt)}</p>
          </div>

          {/* CUSTOMER */}
          <div className="thermal-section">
            <ReceiptRow
              label="Customer"
              value={customer?.name || "Walk-in"}
            />

            <ReceiptRow
              label="Tipe"
              value={order.orderType || "-"}
            />

            {order.tableNumber && (
              <ReceiptRow
                label="Meja"
                value={order.tableNumber}
              />
            )}

            <ReceiptRow
              label="Status"
              value={
                isMember
                  ? "MEMBER"
                  : "WALK-IN"
              }
            />

            {isMember && membership?.memberCode && (
              <ReceiptRow
                label="Member"
                value={membership.memberCode}
              />
            )}
          </div>

          {/* ITEMS */}
          <div className="thermal-section">
            <strong>PESANAN</strong>

            {orderItems.length > 0 ? (
              orderItems.map(
                (item: any, index: number) => {
                  const itemPrice = Number(
                    item.price || 0,
                  );

                  const quantity = Number(
                    item.quantity || 0,
                  );

                  const itemTotal =
                    itemPrice * quantity;

                  return (
                    <div
                      key={item.id || index}
                      className="thermal-item"
                    >
                      <strong>
                        {index + 1}.{" "}
                        {item.menuItem?.name ||
                          "Menu"}
                      </strong>

                      <div className="thermal-item-row">
                        <span>
                          {quantity} x{" "}
                          {formatRupiah(
                            itemPrice,
                          )}
                        </span>

                        <strong>
                          {formatRupiah(
                            itemTotal,
                          )}
                        </strong>
                      </div>

                      {item.notes && (
                        <small>
                          Catatan: {item.notes}
                        </small>
                      )}
                    </div>
                  );
                },
              )
            ) : (
              <p>Tidak ada item.</p>
            )}
          </div>

          {/* TOTAL */}
          <div className="thermal-section">
            <ReceiptRow
              label="Subtotal"
              value={formatRupiah(subtotal)}
            />

            {tax > 0 && (
              <ReceiptRow
                label="Tax"
                value={formatRupiah(tax)}
              />
            )}

            {serviceCharge > 0 && (
              <ReceiptRow
                label="Service"
                value={formatRupiah(
                  serviceCharge,
                )}
              />
            )}

            {discount > 0 && (
              <ReceiptRow
                label="Diskon Member"
                value={`- ${formatRupiah(
                  discount,
                )}`}
              />
            )}

            <div className="thermal-divider">
              ----------------------------------
            </div>

            <div className="thermal-total">
              <strong>TOTAL</strong>

              <strong>
                {formatRupiah(total)}
              </strong>
            </div>
          </div>

          {/* PAYMENT */}
          {payment && (
            <div className="thermal-section">
              <strong>PEMBAYARAN</strong>

              <ReceiptRow
                label="Metode"
                value={payment.method || "-"}
              />

              <ReceiptRow
                label="Tagihan"
                value={formatRupiah(total)}
              />

              <ReceiptRow
                label="Dibayar"
                value={formatRupiah(paid)}
              />

              <ReceiptRow
                label="Kembalian"
                value={formatRupiah(change)}
              />

              <div className="thermal-paid">
                PEMBAYARAN BERHASIL
              </div>
            </div>
          )}

          {/* FOOTER */}
          <div className="thermal-footer">
            <div className="thermal-divider">
              ==================================
            </div>

            <strong>TERIMA KASIH ❤️</strong>

            <p>
              Selamat menikmati makanan Anda.
            </p>

            <p>
              Simpan struk ini sebagai bukti
              pembayaran.
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          STYLE
      ===================================================== */}

      <style>{`
        /* ================================
           SCREEN RECEIPT
        ================================= */

        .receipt-preview {
          width: 80mm;
          max-width: 100%;
          min-height: 120mm;
          padding: 18px 14px;
          font-family:
            "Courier New",
            Courier,
            monospace;
          color: #111827;
        }

        .receipt-header {
          text-align: center;
          font-size: 11px;
        }

        .receipt-header h1 {
          margin: 0;
          font-size: 19px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .receipt-header h2 {
          margin: 5px 0;
          font-size: 12px;
          font-weight: 900;
        }

        .receipt-header p {
          margin: 2px 0;
          font-size: 9px;
        }

        .receipt-invoice {
          font-weight: 700;
        }

        .receipt-divider {
          width: 100%;
          overflow: hidden;
          white-space: nowrap;
          font-size: 9px;
          color: #64748b;
          margin: 7px 0;
        }

        .receipt-section {
          padding: 8px 0;
          border-bottom: 1px dashed #cbd5e1;
        }

        .receipt-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          font-size: 9px;
          line-height: 1.5;
          margin-bottom: 3px;
        }

        .receipt-row > span:first-child {
          flex-shrink: 0;
        }

        .receipt-row > span:last-child {
          max-width: 65%;
          overflow-wrap: anywhere;
        }

        .receipt-title {
          margin: 0 0 7px;
          font-size: 10px;
          font-weight: 900;
        }

        .receipt-item {
          margin-bottom: 8px;
        }

        .receipt-item-name {
          font-size: 10px;
          font-weight: 700;
          line-height: 1.4;
        }

        .receipt-item-detail {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 9px;
          color: #475569;
          margin-top: 2px;
        }

        .receipt-note {
          font-size: 8px;
          color: #64748b;
          font-style: italic;
          margin-top: 2px;
          overflow-wrap: anywhere;
        }

        .receipt-empty {
          font-size: 9px;
          color: #64748b;
          text-align: center;
        }

        .receipt-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          font-weight: 900;
        }

        .receipt-paid {
          text-align: center;
          margin-top: 8px;
          padding: 5px;
          border: 1px solid #059669;
          color: #059669;
          font-size: 8px;
          font-weight: 900;
        }

        .receipt-footer {
          text-align: center;
          padding-top: 4px;
          font-size: 9px;
        }

        .receipt-footer strong {
          font-size: 10px;
        }

        .receipt-footer p {
          margin: 3px 0 0;
          color: #64748b;
          font-size: 8px;
        }

        /* ================================
           PRINT AREA HIDDEN ON SCREEN
        ================================= */

        .thermal-print {
          display: none;
        }

        /* ================================
           PRINT
        ================================= */

        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }

          html,
          body {
            width: 80mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          body * {
            visibility: hidden !important;
          }

          .thermal-print,
          .thermal-print * {
            visibility: visible !important;
          }

          .thermal-print {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .thermal-receipt {
            width: 80mm !important;
            box-sizing: border-box;
            padding: 5mm 4mm 8mm;
            font-family:
              "Courier New",
              Courier,
              monospace;
            font-size: 9px;
            line-height: 1.4;
            color: #000 !important;
            background: #fff !important;
          }

          .thermal-header {
            text-align: center;
            padding-bottom: 4px;
          }

          .thermal-header h1 {
            margin: 0;
            font-size: 18px;
            font-weight: 900;
            letter-spacing: 1px;
          }

          .thermal-header p {
            margin: 2px 0;
            font-size: 8px;
          }

          .thermal-header strong {
            display: block;
            margin-top: 5px;
            font-size: 10px;
          }

          .thermal-divider {
            width: 100%;
            overflow: hidden;
            white-space: nowrap;
            font-size: 8px;
            margin: 4px 0;
          }

          .thermal-section {
            padding: 6px 0;
            border-bottom: 1px dashed #000;
            page-break-inside: avoid;
          }

          .thermal-section:last-child {
            border-bottom: 0;
          }

          .thermal-section > strong {
            display: block;
            margin-bottom: 5px;
            font-size: 9px;
          }

          .thermal-section .receipt-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 8px;
            margin-bottom: 3px;
            font-size: 8px;
          }

          .thermal-section .receipt-row > span:last-child {
            max-width: 65%;
            text-align: right;
            overflow-wrap: anywhere;
          }

          .thermal-item {
            margin-bottom: 7px;
            page-break-inside: avoid;
          }

          .thermal-item > strong {
            display: block;
            font-size: 9px;
            line-height: 1.4;
            overflow-wrap: anywhere;
          }

          .thermal-item-row {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            font-size: 8px;
            margin-top: 2px;
          }

          .thermal-item small {
            display: block;
            margin-top: 2px;
            color: #444;
            font-size: 7px;
            font-style: italic;
            overflow-wrap: anywhere;
          }

          .thermal-total {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            margin-top: 4px;
          }

          .thermal-paid {
            text-align: center;
            border: 1px solid #000;
            padding: 5px;
            margin-top: 7px;
            font-size: 8px;
            font-weight: bold;
          }

          .thermal-footer {
            text-align: center;
            padding-top: 4px;
            font-size: 8px;
          }

          .thermal-footer strong {
            font-size: 10px;
          }

          .thermal-footer p {
            margin: 3px 0 0;
            font-size: 7px;
          }
        }
      `}</style>
    </>
  );
}

