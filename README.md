# VNG-IT-REQUEST-COUNTER

Ứng dụng Node.js nhỏ hiển thị số request HTTP đi vào app kể từ lúc process khởi động.

## Chạy local

Yêu cầu Node.js 20 trở lên.

```bash
npm start
```

Mặc định app chạy tại `http://localhost:3000`; có thể đổi cổng bằng biến môi trường `PORT`.

## Endpoint

- `GET /`: dashboard và được tính là một request.
- `POST /api/request`: tạo một request thử và tăng bộ đếm.
- `GET /api/count`: đọc số liệu, không làm tăng bộ đếm.
- `GET /health`: healthcheck, không làm tăng bộ đếm.

Số liệu chỉ nằm trong bộ nhớ nên sẽ bắt đầu lại khi process restart hoặc ứng dụng được redeploy.

## Production

App đang chạy trên Dokploy tại:

<https://vng-it-request-counter-uziz5s-d5127f-103-72-57-55.sslip.io>

Thông tin redeploy không chứa secret được lưu trong `.dokploy/deploy.json`.
