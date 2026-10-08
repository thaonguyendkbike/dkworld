# Brief dự án: DK Bike World

> Các mục đánh dấu **[CẦN XÁC NHẬN]** là chỗ tôi chưa có số liệu. Agent phải hỏi, không tự đoán.

## 1. Mục tiêu
Trang web 3D low-poly mô phỏng khuôn viên công ty DK Bike (Lạng Sơn?) **[CẦN XÁC NHẬN địa điểm]**: nhà xưởng, đường nội bộ, đồi phía sau, đường ray và kênh bên cạnh. Có đổi ngày/chiều/đêm, thời tiết, nhạc nền, hoạt cảnh nhẹ. Dùng để giới thiệu công ty.

## 2. Phạm vi khu đất
- Khu cần dựng: **[CẦN XÁC NHẬN: DK1 hay DK2 hay cả hai]**
- DK1: diện tích đất 4.500 m²
- DK2: diện tích đất 5.898 m²
- Tỷ lệ: **[CẦN XÁC NHẬN]** ví dụ "Nhà B rộng ~__ m" hoặc "thước tỷ lệ ở góc ảnh CAD". Từ đó đổi pixel sang mét.

## 3. Tư liệu đầu vào (`inputs/`)
| File | Nội dung |
|---|---|
| `cad/cad_khuon_vien.png` | Mặt bằng CAD đánh dấu Nhà A, B, C, nhà ăn, đường nội bộ (đường rộng 3 m), khu tập kết xe sau chạy thử, lối vào phía đông-nam |
| `plans/MAT_BANG_DK1_DK2.pdf` | Mặt bằng tổng thể DK1, DK2, bảng diện tích |
| `photos-oblique/DJI_0728.jpg`, `DJI_0841.jpg` | Ảnh drone nghiêng: hình dáng, màu mái/tường, tường chắn, đường ray, kênh |
| `photos-topdown/` | Ảnh drone chụp thẳng: nền để căn vị trí. Thấy mái xanh dài (giống Nhà C), mái che xanh trong suốt, sân bê tông, đường quanh đồi, bể tròn, nhà có pin mặt trời |
| `reference/` | Ảnh chụp màn hình Grand Valley (phong cách + bảng điều khiển) |

Ghi chú: `DJI_0734.DNG` là RAW, cần đổi sang JPG (cạnh dài ~2500 px) trước khi dùng.

## 4. Công trình
| Mã | Công năng | Số tầng | Cao ước tính | Mái / tường | Ghi chú |
|---|---|---|---|---|---|
| Nhà B | Xưởng sản xuất | 3 | **[?] m** | Mái xám đậm, tường panel xám, chân tầng 1 sáng màu, logo "DK Bike" | Lớn nhất, sát trục đường phía đông |
| Nhà A | Văn phòng + kho/kỹ thuật | **[?]** | **[?] m** | Mái xám xanh, tường xám | Nhiều cửa sổ, thang thoát hiểm ngoài |
| Nhà C | Kho | **[?]** | **[?] m** | Mái tôn xanh dương | Hình thang nhọn, nằm sát ranh phía bắc |
| Nhà ăn | Nhà ăn | **[?]** | **[?] m** | **[?]** | Phía nam, tách riêng |
| Mái che xe | Mái che xanh trong suốt | 1 | ~5 m | Khung thép, tấm xanh lơ | Có xe ba bánh đỗ bên dưới |

Số liệu từ PDF (khu DK2, tham khảo): nhà điều hành 253 m², khu kho LK (khu 5, 6) 1.080 m², xưởng + kho LK (khu 7-10) 2.170 m², cảnh quan 45 m², nhà xe 140 m².

## 5. Địa hình và cảnh quan
- Đồi phía sau (bắc/tây-bắc), có đường lên đồi uốn lượn, bậc thang, bậc cấp trồng cây.
- Tường chắn đá dọc ranh khu đất, **[CẦN XÁC NHẬN chiều cao]**.
- Kênh nước và đường ray chạy sát phía đông-nam; đường quốc lộ/đường lớn xa hơn.
- Cây: hàng cây cảnh dọc đường, bụi cây tỉa, rừng trên đồi.
- Khu dân cư mái ngói đỏ xung quanh (chỉ dựng khối đơn giản làm nền).

## 6. Tính năng
Bắt buộc: camera xoay/zoom (chuột + cảm ứng), ngày/chiều/đêm, nắng/mưa, nhạc nền + âm lượng, bảng điều khiển.
Hoạt cảnh: tàu hỏa trên đường ray, xe DK Bike chạy trong khuôn viên, xe tải ra vào, người đi bộ, cờ, khí cầu/chim, nước kênh chuyển động.
**[CẦN XÁC NHẬN]**: giữ tàu hỏa hay thay bằng xe DK Bike làm nhân vật chính?

## 7. Các giai đoạn (xong mỗi giai đoạn thì dừng chờ duyệt)
1. **Khởi tạo**: Vite + Three.js, camera, đất phẳng, ánh sáng, chạy được trên điện thoại.
2. **Mặt bằng đúng tỷ lệ**: nhà A, B, C, nhà ăn, mái che xe, đường nội bộ đúng vị trí và chiều cao (hộp khối đơn giản). So với ảnh topdown.
3. **Địa hình và cảnh quan**: đồi, tường chắn, kênh, đường ray, cây theo cụm.
4. **Làm đẹp**: màu thật, cửa sổ, mái, logo, bóng đổ, sương, mây.
5. **Hoạt cảnh**: tàu/xe/người/khí cầu.
6. **Giao diện + nhạc + ngày/đêm + thời tiết**.
7. **Tối ưu** di động, nén asset.
8. **Triển khai** lên Cloudflare Pages.

## 8. Việc đầu tiên agent phải làm
Chưa viết code. Đọc brief và xem toàn bộ `inputs/`, rồi:
1. Tóm tắt cách hiểu về khuôn viên (vị trí các tòa, đường, địa hình, hướng bắc).
2. Liệt kê toàn bộ thông tin còn thiếu theo mục **[CẦN XÁC NHẬN]**.
3. Đề xuất ít nhất 3 điểm trùng nhau giữa ảnh CAD và ảnh topdown để căn chỉnh.
