# Brief dự án: DK Bike World (Cập nhật từ CAD, PDF & Ảnh Drone)

> Tài liệu mô tả quy hoạch, thông số kiến trúc và lộ trình triển khai trang web 3D diorama khuôn viên DKBike.
> Dữ liệu được trích xuất và đối soát chính xác từ CAD mặt bằng (`MAT BANG DK1 DK2.pdf`), ảnh vệ tinh Google Maps và bộ ảnh drone thực tế.

---

## 1. Mục tiêu & Địa điểm
- **Mục tiêu**: Xây dựng trang web 3D diorama low-poly chạy trực tiếp trên trình duyệt (hỗ trợ mượt mà trên desktop 60 fps và smartphone 30 fps), tái hiện khuôn viên nhà máy DK Bike. Có chuyển đổi ngày / chiều hoàng hôn / ban đêm, thời tiết, nhạc nền, camera tương tác xoay/zoom/pan mượt mà.
- **Địa điểm xác nhận**: Xã Hoàng Đồng / Hợp Thành, TP. Lạng Sơn, tỉnh Lạng Sơn. 
  - Tọa lạc trên mặt đường ĐT234 (Đường Tỉnh 234).
  - Phía Đông giáp tuyến đường sắt Bắc - Nam và Quốc lộ 1A (AH1).
  - Phía Tây tựa vào dãy đồi núi thoải.

---

## 2. Phạm vi khu đất & Hệ tọa độ
- **Phạm vi tổng thể**: Gồm 2 phân khu chính nằm đối diện nhau qua trục đường ĐT234:
  1. **Phân khu DK1 (Khuôn viên nhà máy chính - Ưu tiên dựng 3D chi tiết)**:
     - Diện tích đất: **4.500 m²**.
     - Giới hạn: Phía Tây giáp ĐT234 (cổng vào), phía Đông giáp đường ray xe lửa và mương/kênh thủy lợi, phía Bắc giáp sườn đồi, phía Nam giáp khu dân cư và đường dẫn 5m.
     - Công trình trọng điểm: Xưởng sản xuất Nhà B (lớn nhất), Nhà văn phòng/kho A, Nhà kho C, Nhà ăn, Mái che xe 3 bánh, đường chạy thử xe.
  2. **Phân khu DK2 (Khu mở rộng & kho phụ / vườn cảnh quan)**:
     - Diện tích đất: **5.898 m²**.
     - Giới hạn: Nằm phía Tây đường ĐT234.
     - Công trình: Nhà điều hành trụ sở chính (253 m², mái gắn pin mặt trời), xưởng sản xuất + kho LK (2.170 m²), sân bê tông tập kết xe thành phẩm rộng lớn, đường uốn lượn leo đồi taluy đá dẫn lên vườn lan và hồ cảnh quan tròn.
- **Tỷ lệ quy đổi bản vẽ CAD**:
  - Thước tỷ lệ trên bản vẽ: `0M - 5M - 10M - 15M`.
  - Đo đạc chính xác: 15 mét = 76.5 pixels (trên bản vẽ scan gốc 2x) $\rightarrow$ **1 mét = 5.10 pixels** (hoặc 1 px = 0.196 m).
  - Đơn vị không gian 3D: **1 unit = 1 mét**.
  - Gốc tọa độ $(0, 0, 0)$: Góc Tây-Nam của phân khu DK1 (cổng vào giáp ĐT234).

---

## 3. Danh mục công trình phân khu DK1

| Mã công trình | Chức năng | Số tầng | Kích thước (Dài x Rộng x Cao) | Đặc điểm kiến trúc & Màu sắc |
|---|---|---|---|---|
| **Nhà B** | Xưởng sản xuất chính | 3 tầng | ~**33.5m x 22.5m x 13.5m** | Tường panel xám ghi đậm hiện đại, chân tường tầng 1 ốp trắng sáng cao 1.5m. Mái dốc nhẹ xám than chì, có sống mái thông gió dài (monitor roof). Chữ nổi màu vàng kim "DK Bike" cỡ lớn ở mặt tiền và góc hồi. |
| **Nhà A** | Văn phòng + Kho kỹ thuật | 3 tầng | ~**32.5m x 12.2m x 11.0m** | Tường màu xám ghi nhạt, các dãy cửa sổ băng kính dài viền trắng đón sáng. Mái tôn dốc màu xám bạc. Đầu hồi phía Tây có lồng cầu thang thoát hiểm khung thép sơn xanh dương nổi bật. |
| **Nhà C** | Kho phụ tùng / xưởng phụ | 1-2 tầng | ~**14.1m x 11.8m x 6.5m** | Mặt bằng hình thang vát góc sát bờ ranh phía Bắc. Mái tôn dốc màu xanh dương tươi (royal blue), phía trên có lắp các tấm pin năng lượng mặt trời. |
| **Nhà ăn** | Nhà ăn CBNV | 3 tầng | ~**20.4m x 11.6m x 10.5m** | Khối nhà độc lập nằm ở góc Tây-Nam khuôn viên DK1, tường màu kem/xám, mái đỏ nâu/xanh. |
| **Mái che xe** | Bãi đỗ xe điện 3 bánh | 1 tầng | ~**30.0m x 6.0m x 4.5m** | Khung thép sơn trắng/xanh, mái che sóng polycarbonate màu xanh lơ trong suốt (cyan translucent), che dãy xe 3 bánh điện DK Bike. |
| **Đường chạy thử** | Test track kiểm tra xe | Mặt đất | Lòng đường rộng **3.0m** | Đường bê tông xám uốn quanh xưởng Nhà B, có vạch kẻ và mũi tên sơn chỉ hướng chạy thử xe. |
| **Khu tập kết xe**| Bãi chờ sau chạy thử | Mặt đất | ~**25m x 8m** | Sân bê tông phẳng phía Nam Nhà B trước khi xe được xuất xưởng. |
| **Nhà bảo vệ & Cổng** | Kiểm soát ra vào | 1 tầng | ~**4.0m x 3.0m x 3.2m** | Đặt cạnh cổng ra vào phía Đông Nam (nối ra đường dốc 5m). |

---

## 4. Địa hình, Giao thông & Cảnh quan xung quanh
1. **Tường kè đá (Retaining Wall)**: Bờ taluy kè bằng đá hộc xếp cao từ 3.5m đến 5.0m chạy dọc bảo vệ mép bờ Đông và bờ Bắc khuôn viên DK1, có cầu thang bộ bằng đá dẫn xuống.
2. **Kênh nước & Tuyến đường sắt**:
   - Chạy song song ngay chân bờ kè đá phía Đông của DK1.
   - Kênh dẫn nước bề rộng ~4m, có cầu bê tông nhỏ bắc qua.
   - Tuyến đường sắt đơn (khổ ray 1.000mm / 1.435mm) chạy song song với đường sắt Lạng Sơn - Hà Nội.
   - Phía xa hơn (khoảng 35m) là trục Quốc lộ 1A (AH1) đông đúc xe cộ qua lại.
3. **Sườn đồi phía sau**:
   - Đồi dốc thoải nằm ở phía Bắc/Tây Bắc, cây cối xanh tươi, rừng keo và thảm thực vật thấp.
4. **Cụm dân cư phụ cận**:
   - Các ngôi nhà dân thấp tầng mái ngói đỏ truyền thống nằm rải rác ven đường ĐT234 làm nền bối cảnh.

---

## 5. Kế hoạch triển khai theo từng giai đoạn

- **Giai đoạn 1: Khởi tạo nền tảng (Đang thực hiện)**
  - Cấu hình Vite + Three.js, Canvas toàn màn hình, hỗ trợ mượt mà di động và máy tính.
  - Camera OrbitControls với góc nhìn diorama nghiêng 45 độ, giới hạn góc quay và khoảng cách zoom hợp lý.
  - Mặt đất phẳng chuẩn kích thước, ánh sáng Ambient + Directional Light mềm mại, sương mù nhẹ nhàng (fog).
  - Tách bạch toàn bộ thông số vào `src/config.js`.

- **Giai đoạn 2: Mặt bằng khối tỷ lệ chuẩn (Hoàn thành song song)**
  - Dựng các khối hình học chuẩn tỉ lệ (1m = 1 unit) của Nhà B, Nhà A, Nhà C, Nhà ăn, Mái che xe, sân bãi và tuyến đường nội bộ 3m.
  - Căn chỉnh tọa độ theo bản vẽ CAD và ảnh chụp drone topdown.

- **Giai đoạn 3: Địa hình và cảnh quan**
  - Dựng sườn đồi, bờ kè đá, mương nước, ray tàu hỏa, cụm cây xanh InstancedMesh.

- **Giai đoạn 4: Chi tiết hóa & Chất liệu thực tế**
  - Áp màu panel xám cho Nhà B, logo "DK Bike", cửa sổ băng Nhà A, mái tôn xanh Nhà C, mái che trong suốt.
  - Tấm pin mặt trời, bóng đổ mềm mại, mây low-poly.

- **Giai đoạn 5: Hoạt cảnh sống động**
  - Xe máy điện DK Bike chạy tuần tra trên test track, tàu hỏa chạy trên đường ray, mặt nước kênh sóng gợn.

- **Giai đoạn 6: Giao diện điều khiển & Trải nghiệm**
  - Bộ nút UI phong cách glassmorphism: Chuyển thời gian (Ngày / Hoàng hôn / Đêm), Bật/Tắt mưa, Nhạc nền thư giãn, Focus camera vào từng tòa nhà.

- **Giai đoạn 7: Tối ưu & Đóng gói Cloudflare Pages**
  - Tối ưu bộ nhớ, draw calls, kiểm thử fps trên mobile, deploy.
