# Bộ prompt nâng cấp DK Bike World (10 khối)

Cách dùng: dán **từng khối một** vào Antigravity/Gemini. Ở Khối 0, đính kèm **ảnh mẫu (Grand Valley)** và **ảnh hiện tại**. Sau mỗi khối, chụp màn hình, so với ảnh mẫu, rồi mới sang khối kế tiếp.

**Thứ tự nên làm:** 0, 2, 3, 1, 7, 8, 9, 4, 5, 6

---

## Khối 0: Mở đầu (dán đầu tiên, một lần)

```
Tôi đính kèm 2 ảnh: ẢNH MẪU (phong cách đích) và ẢNH HIỆN TẠI (kết quả của bạn).
Quy tắc chung cho tất cả yêu cầu sau:
- Giữ nguyên chức năng, số liệu, tên và vị trí công trình, thanh điều hướng, bảng thông tin.
- Chỉ nâng cấp phần hình ảnh/hoạt cảnh theo từng yêu cầu tôi gửi, không tự làm thêm việc khác.
- Mục tiêu 60 FPS desktop, ≥30 FPS điện thoại tầm trung. Dùng InstancedMesh, gộp geometry, giới hạn số đèn/bóng.
- Mọi hằng số (màu, mật độ, tốc độ, số lượng) đặt trong file cấu hình để tôi chỉnh.
- Xong mỗi yêu cầu: tóm tắt đã đổi gì, FPS hiện tại, và điểm còn khác so với ảnh mẫu.
Hãy xác nhận đã hiểu, chưa cần sửa gì.
```

---

## Khối 1: Địa hình và bố cục

```
Nâng cấp địa hình và bố cục để giống ảnh mẫu.
- Bỏ cảm giác "đảo lơ lửng trên nền trống": địa hình kéo đến chân trời, rìa xa mờ dần vào sương (FogExp2 cùng màu đáy bầu trời), không lộ mép.
- Đồi nhấp nhô mềm bằng heightmap nhiễu nhiều tầng (fbm), lưới đủ mịn, không còn mảng đa giác khổng lồ.
- Tô vertex color theo độ cao + nhiễu: xanh sáng ở vùng thấp, xanh đậm ở sườn, vàng cỏ úa rải rác, đất/cát ở bờ nước và đường mòn.
- Giữ nền khuôn viên phẳng, đúng vị trí và kích thước hiện có.
```

---

## Khối 2: Rừng và cây cối

```
Làm rừng dày như ảnh mẫu.
- Phủ kín sườn đồi và rìa khu đất bằng InstancedMesh (hàng nghìn cây vẫn 60 FPS).
- Ít nhất 4 loại: (a) tán tròn low-poly (IcosahedronGeometry detail 0-1, dịch đỉnh ngẫu nhiên, flatShading), (b) thông nhiều tầng hình nón, (c) cây tán vàng/cam điểm xuyên, (d) bụi thấp.
- Mỗi cây có xoay, tỉ lệ, sắc độ khác nhau (instanceColor). Phân bố theo cụm bằng nhiễu, KHÔNG xếp thẳng hàng. Chỉ cây cảnh dọc đường trong khuôn viên được xếp đều.
- Rải hoa dại, đá nhỏ, cỏ tuft. Cây đung đưa nhẹ theo gió (vertex shader đơn giản).
```

---

## Khối 3: Màu sắc, ánh sáng, bầu trời

```
Sửa màu và ánh sáng cho có chiều sâu như ảnh mẫu.
- Bỏ tông xanh bạc hà nhạt. Dùng bảng màu đậm, ấm, xanh lá bão hòa, tương phản sáng-tối rõ.
- Renderer: sRGB, ACESFilmic tone mapping, exposure ~1.0-1.2.
- DirectionalLight (nắng góc thấp) + HemisphereLight. Bóng đổ mềm (PCFSoftShadowMap), shadow camera bao đúng vùng nhìn thấy.
- Thêm ambient occlusion (hoặc giả lập tối chân cây/chân nhà), bloom rất nhẹ, vignette nhẹ.
- Bầu trời gradient mềm, mây low-poly trôi chậm.
- Chế độ chiều/đêm: đổi màu sương, bóng, bật đèn cửa sổ, đèn đường, đèn xe.
```

---

## Khối 4: Nước

```
Làm sông/kênh đẹp như ảnh mẫu.
- Shader nước cách điệu: màu theo độ sâu (xanh ngọc ở bờ, xanh đậm ở giữa), họa tiết nhiễu chuyển động chậm, vệt sáng trắng, viền bọt ở bờ.
- Bờ cát mỏng, đá ven bờ, lá sen, cá/chim nhỏ, sóng gợn quanh thuyền.
- Mưa: gợn tròn trên mặt nước.
```

---

## Khối 5: Công trình

```
Nâng chi tiết công trình, giữ nguyên kích thước và vị trí.
- Nhà B, A, C, nhà ăn: nhiều dãy cửa sổ, cửa cuốn tầng trệt, gờ mái, tấm lấy sáng, ống thoát, thang thoát hiểm ngoài, logo DK Bike, pin mặt trời trên mái.
- Màu đúng ảnh drone: Nhà B tường xám mái xám đậm; Nhà C mái tôn xanh dương; mái che xe xanh trong suốt.
- Hạ tầng: đường có vạch kẻ, vỉa hè, đèn đường (sáng ban đêm), bãi xe, hàng rào, cổng, cột cờ có cờ bay.
- Đường ray có tà vẹt và đá dăm; tàu có khói bồng bềnh (các quả cầu trắng to dần rồi tan).
```

---

## Khối 6: Giao diện và camera

```
Làm gọn giao diện và camera.
- Camera mặc định thấp và gần hơn, nhìn xéo xuống khuôn viên, thấy cả đồi và rừng phía sau. Chuyển camera mượt khi chọn công trình.
- Nhãn công trình mặc định thu nhỏ thành chấm, chỉ hiện đầy đủ khi rê chuột/chạm hoặc zoom gần. Menu có thể thu gọn. Panel thông tin chỉ hiện khi chọn và đóng được.
- Kiểu kính mờ (glass) bo góc, chữ nhỏ gọn như bảng Settings ở ảnh mẫu.
```

---

## Khối 7: Người

```
Làm lại nhân vật người theo phong cách low-poly dễ thương, nhất quán với cảnh.
Mô hình:
- Dựng từ hình khối đơn giản (đầu cầu/capsule, thân, tay, chân), cao ~1.7 m theo tỉ lệ cảnh, có 3-4 kiểu dáng/chiều cao khác nhau.
- Phân vai bằng trang phục và màu: công nhân (áo bảo hộ xanh/cam, mũ cứng, giày), nhân viên văn phòng (áo sơ mi, quần tối), kỹ thuật viên, bảo vệ (đồng phục, mũ), khách tham quan. Màu da, tóc và quần áo ngẫu nhiên từ một bảng màu.
Hoạt động (animation nhẹ bằng xoay khớp, không cần skeleton nặng):
- Đi bộ có đung đưa tay chân, dừng lại nói chuyện theo nhóm 2-3 người, ngồi ăn ở nhà ăn, đứng nghỉ giải lao ở sân, làm việc cạnh máy ở khu bốc dỡ.
- Giờ cao điểm (sáng, trưa, chiều) đông người ra vào cổng và nhà ăn; ban đêm chỉ còn bảo vệ tuần tra.
Hệ thống:
- Dùng đường đi (waypoint graph) trong khuôn viên, tránh va vào nhau và vào xe, nhường xe ở lối băng qua đường.
- Số lượng cấu hình được (mặc định 25-40), dùng InstancedMesh hoặc gộp mesh để giữ FPS.
- Bóng đổ nhỏ dưới chân, ban đêm có đèn pin/áo phản quang.
```

---

## Khối 8: Xe máy điện và phương tiện đi lại

```
Làm xe máy điện và xe đạp điện DK Bike đẹp, có hoạt cảnh.
Mô hình (low-poly, chi tiết vừa đủ, đúng tỉ lệ so với người):
- Xe máy điện (~1.8 m): thân xe bo tròn, yên, đèn pha/đèn hậu (sáng ban đêm), gương, bánh xe quay. Nhiều mẫu và màu (xanh, đỏ, trắng, đen), có logo DK Bike trên thân.
- Xe đạp điện/xe đạp thể thao: khung, bánh nan, yên.
- Xe ba bánh chở hàng (như xe dưới mái che xanh trong ảnh drone), xe bán tải trắng (như ảnh drone), ô tô con.
Hoạt cảnh:
- Người cưỡi xe có tư thế ngồi, quay đầu xe ở ngã rẽ, nghiêng nhẹ khi vào cua, bánh quay đúng tốc độ.
- Chạy theo đường nội bộ (đường rộng 3 m) với giới hạn tốc độ thấp, giảm tốc khi gặp người, dừng nhường khi có xe lớn.
- Khu thử xe: xe mới chạy thử rồi tập kết ở "Khu vực tập kết xe sau chạy thử" như bản vẽ CAD; có hàng xe đỗ gọn gàng.
- Trạm sạc EV: xe vào sạc, có vòng sáng xanh, đèn nhấp nháy, rời đi khi đầy.
Ban đêm: đèn pha tạo vệt sáng nhẹ trên đường.
```

---

## Khối 9: Xe nâng, xe tải và logistics

```
Làm xe nâng, xe hàng và dòng logistics.
Mô hình:
- Xe nâng điện (forklift): thân vàng/cam, khung nâng (mast) lên xuống được, càng nâng, mái bảo vệ người lái, đèn xoay cảnh báo, người lái ngồi trên xe.
- Xe tải (nhiều cỡ): xe tải nhỏ 1.5 tấn, xe tải thùng 5 tấn, xe container đầu kéo. Cabin, thùng, bánh nhiều trục, đèn, logo/màu khác nhau; cửa thùng mở được khi bốc dỡ.
- Xe đẩy pallet, xe kéo nhỏ chở hàng, pallet và thùng carton xếp chồng, khung xe đạp/xe máy chưa lắp ráp xếp trong kho.
Quy trình hoạt cảnh (vòng lặp liên tục):
1) Xe tải vào cổng, chạy tới bãi bốc dỡ, lùi sát cửa kho.
2) Xe nâng ra, nâng pallet từ thùng xe, đi vào Nhà B/Nhà C/kho, đặt hàng lên giá.
3) Hàng thành phẩm (xe điện đóng thùng) được xe nâng chuyển ra xe tải; xe tải đóng cửa và rời cổng.
- Mỗi xe có trạng thái rõ ràng (chờ, chạy, bốc, dỡ), tránh kẹt: hàng đợi nếu bãi bận.
- Xe nâng giảm tốc khi có người, đèn nhấp nháy cảnh báo (không cần âm thanh).
- Số lượng và tần suất chỉnh được trong config. Ban đêm giảm hoạt động, giữ vài xe đỗ.
Cổng và đường vào: thanh chắn tự nâng khi xe tới, bảo vệ đứng chốt.
```

---

## Mẹo khi dùng

- **Một khối, một lần dán.** Nếu AI làm dở một khối, đừng gộp thêm khối khác. Yêu cầu sửa đúng phần thiếu, ví dụ: "xe nâng chưa nâng được pallet, sửa riêng phần này".
- **Kiểm FPS sau khối 2, 7, 8, 9** vì đây là các khối nặng nhất. Nếu FPS tụt, nhờ thêm "LOD đơn giản cho xe và người ở xa camera" và giảm số lượng trong config.
- **Chụp màn hình so sánh** với ảnh mẫu sau mỗi khối rồi gửi lại, kèm câu hỏi "còn khác gì?".
- **Chỉ đích danh khi chưa ưng:** "cây vẫn quá thưa, tăng gấp 5 lần mật độ ở sườn đồi phía sau" hiệu quả hơn "làm đẹp hơn".
- **Gửi ảnh xe thật của DK Bike** ở Khối 8 và ghi "làm xe giống mẫu trong ảnh này".
