# DK Bike World — diorama 3D khuôn viên công ty

Trang web 3D low-poly chạy trên trình duyệt (desktop + điện thoại), mô phỏng khuôn viên DK Bike.
Tham khảo phong cách: `inputs/reference/` (Grand Valley). KHÔNG sao chép tài sản của trang đó.

## Bắt đầu mỗi phiên
1. Đọc `docs/brief.md`.
2. Xem ảnh/PDF trong `inputs/` khi cần đối chiếu.
3. Nếu thiếu số liệu: HỎI tôi hoặc ghi rõ giả định vào `docs/assumptions.md`. Không tự bịa kích thước.

## Công nghệ
- Vite + Three.js (JavaScript hoặc TypeScript), không dùng framework nặng nếu không cần.
- Mọi hằng số (kích thước, vị trí, màu, chiều cao) đặt trong `src/config.js` để dễ chỉnh.
- Đơn vị 3D: 1 đơn vị = 1 mét. Gốc tọa độ = góc Tây-Nam của khu đất (xem brief).
- Hiệu năng: mục tiêu 60 fps desktop, 30 fps điện thoại tầm trung. Dùng InstancedMesh cho cây, giới hạn bóng đổ.

## Quy trình
- Làm TỪNG GIAI ĐOẠN theo `docs/brief.md`. Xong mỗi giai đoạn: chạy thử, chụp ảnh màn hình, so với ảnh drone, rồi dừng chờ tôi duyệt.
- Không refactor lớn hoặc thêm tính năng ngoài giai đoạn hiện tại.
- Commit nhỏ, thông điệp rõ ràng.

## Phong cách hình ảnh
- Low-poly, màu phẳng, ánh sáng mềm, sương mù nhẹ, mây đơn giản.
- Màu mái/tường lấy theo ảnh drone (xem bảng công trình trong brief).

## Giới hạn
- Nhạc/âm thanh/mô hình: chỉ dùng nguồn miễn phí bản quyền (CC0/CC-BY), ghi nguồn vào `docs/credits.md`.
- Không đưa biển số xe, khuôn mặt, thông tin nội bộ nhạy cảm vào sản phẩm.
- Ảnh trong `inputs/` chỉ để tham chiếu, không deploy lên web trừ khi tôi cho phép.
- Đừng tự mở localhost để test nếu tôi không cho phép.

