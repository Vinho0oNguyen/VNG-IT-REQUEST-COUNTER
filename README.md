# VNG-IT-REQUEST-COUNTER

Ứng dụng Node.js nhỏ hiển thị tổng số request HTTP đi vào app và lưu số liệu trên volume bền vững.

## Chạy local

Yêu cầu Node.js 20 trở lên.

```bash
npm start
```

Mặc định app chạy tại `http://localhost:3000`; có thể đổi cổng bằng biến môi trường `PORT`.
Khi chạy local, app lưu dữ liệu vào `./data/request-count.json` theo mặc định. Dùng
`REQUEST_COUNT_FILE` để chọn đường dẫn khác.

## Endpoint

- `GET /`: dashboard và được tính là một request.
- `POST /api/request`: tạo một request thử và tăng bộ đếm.
- `GET /api/count`: đọc số liệu, không làm tăng bộ đếm.
- `GET /health`: healthcheck, không làm tăng bộ đếm.

Số liệu được ghi nguyên tử vào file JSON. Trên Dokploy, volume tên
`vng-it-request-counter-data` được mount tại `/data`, vì vậy số request vẫn được giữ khi restart hoặc redeploy.

`REQUEST_COUNT_INITIAL` chỉ được dùng để nhập số liệu cũ trong lần đầu khi file chưa tồn tại; nếu file đã có,
giá trị trong file luôn được ưu tiên.

## Production

App đang chạy trên Dokploy tại:

<https://vng-it-request-counter-uziz5s-d5127f-103-72-57-55.sslip.io>

Thông tin redeploy không chứa secret được lưu trong `.dokploy/deploy.json`.
