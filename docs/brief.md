# Brief dự án: DK Bike World (Khuôn viên toàn diện DK1 & DK2)

> Tài liệu mô tả quy hoạch, thông số kiến trúc và mô hình 3D hoàn chỉnh cho cả hai phân khu **DK1** và **DK2**.
> Dữ liệu được trích xuất và đối soát chính xác từ CAD mặt bằng (`MAT BANG DK1 DK2.pdf`), ảnh vệ tinh Google Maps và bộ ảnh drone thực tế.

---

## 1. Mục tiêu & Địa điểm
- **Mục tiêu**: Xây dựng trang web 3D diorama low-poly liên hoàn trực tiếp trên trình duyệt (mượt mà 60 fps desktop và 30 fps mobile), tái hiện toàn bộ khuôn viên DK Bike gồm **Phân khu DK1** (nhà máy chính) và **Phân khu DK2** (nhà điều hành, kho mở rộng, bãi thành phẩm và vườn lan trên đồi).
- **Địa điểm xác nhận**: Xã Hoàng Đồng / Hợp Thành, TP. Lạng Sơn, tỉnh Lạng Sơn. 
  - Trục đường chính kết nối 2 khu: **Đường Tỉnh ĐT234** (Đường rộng 6m - 7m).
  - Phía Đông DK1 giáp tuyến đường sắt Bắc - Nam, mương thủy lợi và Quốc lộ 1A (AH1).
  - Phía Tây DK2 tựa vào dãy đồi thoải với cảnh quan vườn lan giật cấp.

---

## 2. Quy mô tổng thể & Tỷ lệ chuẩn
- **Tổng diện tích khuôn viên**: **10.398 m²**
  - **Phân khu DK1**: **4.500 m²** (Nhà máy sản xuất chính, đường chạy thử, ga tàu/đường ray).
  - **Phân khu DK2**: **5.898 m²** (Nhà điều hành trụ sở chính, kho linh kiện, bãi xe thành phẩm, đồi vườn lan).
- **Trục đường ĐT234**: Nằm ở giữa, chia tách và kết nối hai cổng của DK1 và DK2.
- **Tỷ lệ quy đổi bản vẽ CAD**:
  - Thước tỷ lệ trên bản vẽ: $0M \rightarrow 5M \rightarrow 10M \rightarrow 15M$.
  - Tỷ lệ: **$1\text{ mét} = 5.10\text{ px}$** (trên bản vẽ scan 2x).
  - Đơn vị không gian 3D: **$1\text{ unit} = 1.0\text{ mét}$**.
  - Gốc tọa độ $(0, 0, 0)$: Góc Tây-Nam của phân khu DK1 (ngay ngõ rẽ vào từ đường ĐT234).

---

## 3. Danh mục công trình phân khu DK1 (4.500 m²)

| Mã công trình | Chức năng | Số tầng | Kích thước $(D \times R \times C)$ | Đặc điểm kiến trúc & Màu sắc |
|---|---|---|---|---|
| **Nhà B** | Xưởng sản xuất chính | 3 tầng | ~**33.5m × 22.5m × 13.5m** | Panel xám ghi đậm, chân tường tầng 1 ốp trắng sáng cao 1.5m. Mái xám than chì có sống mái thông gió dài. Chữ nổi màu vàng kim "DK Bike" cỡ lớn. |
| **Nhà A** | Văn phòng & Kỹ thuật | 3 tầng | ~**32.5m × 12.2m × 11.0m** | Panel xám ghi nhạt, cửa sổ kính băng dài. Cầu thang thoát hiểm ngoài trời thép xanh dương. Cầu nối sang Nhà B. |
| **Nhà C** | Kho phụ tùng & xưởng phụ | 1-2 tầng | ~**14.1m × 11.8m × 6.5m** | Hình thang vát góc sát ranh Bắc. Mái tôn xanh dương tươi (royal blue) gắn pin mặt trời. |
| **Nhà ăn** | Nhà ăn CBNV | 3 tầng | ~**20.4m × 11.6m × 10.5m** | Độc lập ở góc Tây Nam, mái ngói đỏ nâu. |
| **Mái che xe** | Bãi đỗ xe điện 3 bánh | 1 tầng | ~**28.0m × 6.0m × 4.2m** | Khung thép, mái polycarbonate sóng xanh lơ trong suốt (cyan). |
| **Đường chạy thử** | Test track xe máy điện | Mặt đất | Rộng **3.0m** | Bo quanh Nhà B, có mũi tên sơn vàng chỉ hướng chạy. |
| **Bờ kè & Kênh & Ray** | Giới hạn bờ Đông | Cao 4.0m | Dài 130m | Bờ kè đá hộc, kênh nước xanh 4.5m, đường ray xe lửa song song. |

---

## 4. Danh mục công trình phân khu DK2 (5.898 m²)

| Mã công trình | Chức năng | Số tầng / Quy mô | Kích thước $(D \times R \times C)$ | Đặc điểm kiến trúc & Màu sắc |
|---|---|---|---|---|
| **Nhà điều hành DK2** | Trụ sở điều hành chính | 3 tầng (253 m² sàn) | ~**22.0m × 12.0m × 11.5m** | Tòa nhà văn phòng hiện đại mặt tiền ĐT234, **toàn bộ mái phủ kín dàn pin năng lượng mặt trời**, kề cận hồ cá cảnh và cổng kiểm soát. |
| **Sân xe thành phẩm** | Bãi đỗ xe điện xuất xưởng | Mặt đất (~3.000 m²) | ~**75.0m × 40.0m** | Đại sân bê tông phẳng, có 2 ô sân thể thao/tập kết kẻ sơn xanh lá, xe ô tô/xe tải và xe máy điện đỗ ngay ngắn. |
| **Kho Linh kiện D2.1** | Kho linh kiện & vật tư | 1 tầng | ~**78.0m × 11.0m × 6.5m** | Dãy kho dài chạy dọc phía Bắc sân, mái tôn màu xanh dương tươi, các cửa cuốn chia ngăn (Kho HC, Kho AQ...). |
| **Xưởng sản xuất phía Nam**| Xưởng & kho liên kết | 1-2 tầng (2.170 m²) | ~**85.0m × 16.0m × 8.0m** | Dãy xưởng dài giáp bờ ranh phía Nam, tường panel sáng màu. |
| **Đường lên vườn lan** | Đường dốc uốn lượn | Bề rộng 3.5m | Uốn lượn chữ S leo cao +15m | Tuyến đường bê tông dốc uốn cong men theo triền đồi taluy đá dẫn lên đỉnh. |
| **Hồ cảnh quan tròn** | Bể cá / hồ sinh thái | Bán kính r = 6.0m | Đường kính 12.0m, sâu 1.8m | Bể tròn nhân tạo lát đá, mặt nước xanh biếc tại chân sườn đồi. |
| **Vườn Lan & Chuồng chim**| Nhà lưới sinh thái trên đồi| 1 tầng (~480 m²) | ~**22.0m × 22.0m × 5.5m** | Cụm nhà kính 4 ô vuông với mái che dạng lưới/kính màu xanh lơ trên đỉnh đồi cao. |
| **Bờ taluy đá sườn đồi** | Kè chống sạt lở đồi | Giật 3-4 cấp | Cao từ 4m đến 16m | Hệ bờ kè đá giật cấp bậc thang uốn quanh sườn đồi Tây Bắc. |
