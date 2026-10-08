# Tài liệu giả định & Hệ quy chiếu: DK Bike World (assumptions.md)

Tài liệu này ghi nhận hệ quy chiếu tọa độ và cơ sở đo đạc hoàn chỉnh cho cả hai phân khu **DK1** và **DK2**.

---

## 1. Hệ tọa độ & Tỷ lệ chuẩn (Coordinate System & Scale)

- **Đơn vị 3D**: `1 unit = 1.0 meter`.
- **Gốc tọa độ (0, 0, 0)**:
  - Chọn tại **Góc Tây - Nam của ranh giới khuôn viên DK1** (ngay ngõ rẽ vào từ đường tỉnh ĐT234).
  - Trục $+X$: Hướng sang phía **Đông** (hướng về phía Nhà B, đường sắt, kênh nước và QL1A).
  - Trục $-X$: Hướng sang phía **Tây** (vượt qua đường ĐT234 sang phân khu DK2, sân thành phẩm và sườn đồi Vườn Lan).
  - Trục $+Z$: Hướng sang phía **Nam** (dọc trục đường ĐT234 về trung tâm TP. Lạng Sơn).
  - Trục $-Z$: Hướng sang phía **Bắc** (về phía xưởng Nhà B, đường chạy thử xe, kho D2.1 và đỉnh đồi).
  - Trục $+Y$: Hướng lên trên cao (độ cao công trình so với cao độ cốt 0.00 mặt sân bê tông DK1).

---

## 2. Bảng Tọa độ & Kích thước hoàn chỉnh (DK1 & DK2)

### A. Phân khu DK1 (4.500 m²)
| Đối tượng | Kích thước $(W_x, H_y, D_z)$ (m) | Tọa độ tâm $(X, Y, Z)$ (m) | Ghi chú kiến trúc |
|---|---|---|---|
| **Mặt sân nền DK1** | $100 \times 2.0 \times 90$ | $(45, -1.0, -40)$ | Cao độ $0.00$, bê tông xám |
| **Nhà B (Xưởng chính 3 tầng)** | $22.5 \times 13.5 \times 33.5$ | $(65.0, 6.75, -50.0)$ | Panel xám than, monitor roof, chữ "DK Bike" |
| **Nhà A (Văn phòng 3 tầng)** | $32.5 \times 11.0 \times 12.2$ | $(35.0, 5.5, -35.0)$ | Panel xám nhạt, thang xanh, cầu nối sang B |
| **Nhà C (Kho phụ mái tôn)** | $14.1 \times 6.5 \times 11.8$ | $(45.0, 3.25, -58.5)$ | Mái tôn xanh dương + pin mặt trời |
| **Nhà ăn CBNV (3 tầng)** | $20.4 \times 10.5 \times 11.6$ | $(23.0, 5.25, -12.0)$ | Độc lập góc Tây Nam, mái ngói đỏ |
| **Mái che xe 3 bánh** | $6.0 \times 4.2 \times 28.0$ | $(79.5, 2.1, -46.0)$ | Khung thép, polycarbonate cyan trong suốt |
| **Bờ kè đá phía Đông** | $1.8 \times 4.5 \times 125$ | $(83.2, -2.0, -42.0)$ | Đá hộc xếp xám tro |
| **Đường ray xe lửa** | Rộng $1.4$, Dài $130$ | $(87.5, -0.4, -42.0)$ | 2 thanh ray thép + 65 tà vẹt gỗ |
| **Kênh nước** | Rộng $4.5$, Sâu $1.6$ | $(92.5, -1.6, -42.0)$ | Nước xanh lam phản chiếu |

### B. Trục giao thông kết nối (Đường Tỉnh ĐT234)
| Đối tượng | Kích thước $(W_x, H_y, D_z)$ (m) | Tọa độ tâm $(X, Y, Z)$ (m) | Ghi chú kiến trúc |
|---|---|---|---|
| **Đường tỉnh ĐT234** | Rộng $7.0$, Dài $160$ | $(-10.0, 0.02, -45.0)$ | Nhựa asphalt xám sẫm, vạch kẻ tim đường vàng |

### C. Phân khu DK2 (5.898 m²)
| Đối tượng | Kích thước $(W_x, H_y, D_z)$ (m) | Tọa độ tâm $(X, Y, Z)$ (m) | Ghi chú kiến trúc |
|---|---|---|---|
| **Mặt sân nền DK2** | $110 \times 2.0 \times 85$ | $(-80.0, -1.0, -42.0)$ | Bê tông sân xưởng phẳng |
| **Nhà điều hành DK2 (HQ)** | $22.0 \times 11.5 \times 12.0$ | $(-28.0, 5.75, -28.0)$ | 3 tầng, **mái phủ kín pin năng lượng mặt trời**, hồ cá |
| **Sân xe thành phẩm** | $75.0 \times 0.05 \times 40.0$ | $(-78.0, 0.03, -45.0)$ | Bãi tập kết xe thành phẩm, 2 ô kẻ sân xanh lá |
| **Kho Linh kiện D2.1** | $78.0 \times 6.5 \times 11.0$ | $(-78.0, 3.25, -68.0)$ | Dãy kho dài phía Bắc, mái tôn xanh dương |
| **Xưởng sản xuất phía Nam**| $85.0 \times 8.0 \times 16.0$ | $(-75.0, 4.0, -16.0)$ | Dãy xưởng 2.170 m² dọc ranh Nam |
| **Đường dốc lên đồi** | Rộng $3.5$, Dài $80$ | Bắt đầu $(-100, 0, -45) \rightarrow (-125, 14, -80)$ | Uốn lượn chữ S leo lên đỉnh vườn lan |
| **Hồ cảnh quan tròn** | Đường kính $12.0$, Sâu $1.8$| $(-108.0, -0.6, -65.0)$ | Bể tròn lát đá, nước xanh trong biếc |
| **Vườn Lan trên đồi** | $22.0 \times 5.5 \times 22.0$ | $(-130.0, 16.0, -82.0)$ | Khung thép 4 ô vuông, lưới/kính màu cyan trên cao |
| **Sườn đồi cảnh quan DK2** | Bán kính $50$, Cao $22.0$ | $(-120.0, 8.0, -75.0)$ | Đồi thoải taluy đá giật cấp với rừng cây xanh |
