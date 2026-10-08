# Tài liệu giả định & Hệ quy chiếu: DK Bike World (assumptions.md)

Tài liệu này ghi nhận các giả định tính toán, hệ quy chiếu tọa độ và cơ sở đo đạc được áp dụng trong mô hình 3D khuôn viên DK Bike.

---

## 1. Hệ tọa độ & Tỷ lệ chuẩn (Coordinate System & Scale)

- **Đơn vị 3D**: `1 unit = 1.0 meter` (Tuân thủ nghiêm ngặt quy định trong `CLAUDE.md`).
- **Gốc tọa độ (0, 0, 0)**:
  - Chọn tại **Góc Tây - Nam của ranh giới khuôn viên DK1** (ngay vị trí tiếp giáp đường tỉnh ĐT234 và ngõ vào).
  - Trục $+X$: Hướng sang phía **Đông** (hướng về phía đường sắt, mương thoát nước và QL1A).
  - Trục $+Z$: Hướng sang phía **Nam** (theo chiều dọc đường ĐT234 đi về phía nội thành TP. Lạng Sơn).
  - Trục $-Z$: Hướng sang phía **Bắc** (về phía xưởng Nhà B, đường chạy thử xe và sườn đồi).
  - Trục $+Y$: Hướng lên trên cao (độ cao công trình so với cao độ cốt 0.00 mặt sân bê tông).

---

## 2. Thước tỷ lệ CAD & Cơ sở quy đổi

- Thước tỷ lệ ở giữa bản vẽ CAD (`MAT BANG DK1 DK2.pdf`):
  - Đoạn vạch chuẩn: $0M \rightarrow 5M \rightarrow 10M \rightarrow 15M$.
  - Khoảng cách đo được trên ảnh xuất độ phân giải $1684 \times 1190$: 
    $$15\text{ mét} = 76.5\text{ px} \implies 1\text{ mét} = 5.10\text{ px}$$
- Kiểm chứng chéo:
  - Bề rộng tuyến đường nội bộ trên CAD đo được $15.3\text{ px} \div 5.10 = 3.0\text{ mét}$ (khớp $100\%$ với ghi chú "đường đi 3m" trên bản vẽ CAD).
  - Diện tích sàn tầng 1 Nhà B đo được $33.5\text{m} \times 22.5\text{m} \approx 753\text{ m}^2$, tổng 3 tầng xưởng $\approx 2.260\text{ m}^2$ (khớp chỉ tiêu $2.170\text{ m}^2$ xưởng sản xuất trong bảng PDF).

---

## 3. Tọa độ và Kích thước công trình DK1

| Đối tượng | Kích thước $(W_x, H_y, D_z)$ (m) | Tọa độ tâm $(X, Y, Z)$ (m) | Ghi chú kiến trúc |
|---|---|---|---|
| **Mặt sân nền DK1** | $100 \times 0.2 \times 90$ | $(45, -0.1, -40)$ | Cốt nền bê tông xám nhạt, cao độ $0.00$ |
| **Nhà B (Xưởng 3 tầng)** | $22.5 \times 13.5 \times 33.5$ | $(65.0, 6.75, -50.0)$ | Xưởng sản xuất chính, panel xám chì, chữ DK Bike |
| **Nhà A (Văn phòng 3 tầng)**| $32.5 \times 11.0 \times 12.2$ | $(35.0, 5.5, -35.0)$ | Văn phòng + kỹ thuật, cửa sổ kính, cầu thang ngoài |
| **Nhà C (Kho mái tôn)** | $14.1 \times 6.5 \times 11.8$ | $(45.0, 3.25, -60.0)$ | Nhà kho vát góc, mái tôn xanh + pin mặt trời |
| **Nhà ăn (3 tầng)** | $20.4 \times 10.5 \times 11.6$ | $(22.0, 5.25, -12.0)$ | Tách riêng ở góc Tây Nam |
| **Mái che xe 3 bánh** | $6.0 \times 4.5 \times 30.0$ | $(78.0, 2.25, -45.0)$ | Polycarbonate xanh lơ trong suốt, khung thép |
| **Đường chạy thử xe (Track)**| Dày $0.05$, Rộng $3.0$ | Bo quanh Nhà B | Bê tông nhẵn, vạch kẻ sơn vàng |
| **Bờ kè đá (Retaining Wall)**| Cao $4.0$, Rộng $1.5$ | Dọc trục $X \approx 83$ | Đá hộc xếp màu xám tro, bảo vệ mép bờ Đông |
| **Đường ray xe lửa** | Rộng $1.4$, Dài $120$ | Chạy dọc trục $X = 88$ | Thanh ray kim loại + tà vẹt gỗ/bê tông |
| **Mương/Kênh nước** | Rộng $4.0$, Sâu $1.5$ | Chạy dọc trục $X = 93$ | Nước xanh lam trong, phản xạ ánh sáng |

---

## 4. Giả định vật liệu & Render Low-Poly

- Phong cách: **Diorama Isometric Low-Poly hiện đại**.
- Đổ bóng: Dùng `DirectionalLight` với shadow map $2048 \times 2048$, shadow camera frustum vừa vặn phân khu để tối ưu hiệu năng không tụt fps.
- Vật liệu: `MeshStandardMaterial` với roughness $0.5 - 0.7$, flatShading linh hoạt để làm nổi bật các khối góc cạnh đẹp mắt.
- Bảng màu: Lấy mẫu chính xác từ ảnh chụp drone DJI (`DJI_0728.JPG`, `DJI_0711.JPG`, `DJI_0776.JPG`).
