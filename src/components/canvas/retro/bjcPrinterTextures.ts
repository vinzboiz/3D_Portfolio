import * as THREE from 'three';

/**
 * Tạo CanvasTexture cho logo Canon chính giữa mặt trước và tem nhãn BJC-250 góc dưới bên phải
 */
export function createBjcBadgesTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  // Tỷ lệ 4:1 khớp chính xác với PlaneGeometry 0.34m x 0.085m
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Nền hoàn toàn trong suốt để chỉ hiển thị chữ Canon và tem, hòa tiệp 100% vào vỏ nhựa
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Logo "Canon" chính giữa (Cổ điển Serif thập niên 90 - Kích thước chuẩn tinh tế ~4cm)
  ctx.save();
  ctx.translate(canvas.width / 2, 85);
  ctx.fillStyle = '#18181b';
  ctx.font = 'bold 42px "Times New Roman", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '3px';
  ctx.fillText('Canon', 0, 0);
  ctx.restore();

  // 2. Tem nhãn "BJC-250" ở góc dưới bên phải
  ctx.save();
  ctx.translate(canvas.width - 240, 165);

  // Vùng lõm tem màu bạc xám
  ctx.fillStyle = '#c5c2b8';
  ctx.fillRect(0, 0, 190, 54);
  ctx.strokeStyle = '#a8a59b';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, 190, 54);

  // Chữ BJC-250
  ctx.fillStyle = '#18181b';
  ctx.font = '900 24px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('BJC-250', 14, 27);

  // 3 chấm tròn màu đặc trưng của Canon Bubble Jet (Cyan, Magenta, Yellow)
  const dots = ['#00c0f0', '#e6007e', '#ffd200'];
  dots.forEach((color, i) => {
    ctx.beginPath();
    ctx.arc(135 + i * 16, 27, 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  });

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Tạo texture trang giấy nạp ở khay sau (Giấy in trắng tinh A4 tiêu chuẩn 1997 - Canon High Resolution Paper)
 * Tuyệt đối KHÔNG vẽ chữ in trước để tránh lỗi "giấy chưa in lại bị ghi sẵn"
 */
export function createRearFeederPaperTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 724;
  const ctx = canvas.getContext('2d')!;

  // 1. Nền giấy trắng ngà tự nhiên của giấy in A4 cao cấp
  ctx.fillStyle = '#faf9f6';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Viền mép giấy cực mỏng tạo độ sắc nét
  ctx.strokeStyle = '#e2ded5';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

  // 3. Faint watermark "CANON HR-101" chìm rất mờ (chỉ 4% opacity) chuẩn giấy in ảnh Bubble Jet
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(-Math.PI / 6);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.035)';
  ctx.font = 'bold 22px "Times New Roman", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '6px';
  ctx.fillText('CANON HR-101 • 80g/m²', 0, 0);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Tạo CanvasTexture độ phân giải cao (1024 x 1448) hiển thị bản CV sắc nét của NGUYỄN XUÂN VINH
 */
export function createCvPaperTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1448;
  const ctx = canvas.getContext('2d')!;

  // 1. Nền giấy A4 cao cấp trắng ngà
  ctx.fillStyle = '#fdfdfc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Khung viền kỹ thuật tinh tế 2 lớp
  ctx.strokeStyle = '#e2e2e8';
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);
  ctx.strokeStyle = '#e05a47';
  ctx.lineWidth = 4;
  ctx.strokeRect(44, 44, canvas.width - 88, canvas.height - 88);

  // 2. HEADER
  ctx.save();
  ctx.translate(68, 85);

  // Tên ứng viên
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 44px "Segoe UI", Arial, sans-serif';
  ctx.fillText('NGUYỄN XUÂN VINH', 0, 42);

  // Chức danh
  ctx.fillStyle = '#e05a47';
  ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
  ctx.fillText('FULL-STACK & FRONTEND DEVELOPER · 3D WEBGL ARCHITECT', 0, 78);

  // Thông tin liên hệ
  ctx.fillStyle = '#475569';
  ctx.font = '15px "Segoe UI", Arial, sans-serif';
  ctx.fillText('hello@vinzboiz.dev  |  +84 90 000 0000  |  TP. Hồ Chí Minh, Việt Nam', 0, 108);
  ctx.fillText('github.com/vinzboiz  |  linkedin.com/in/vinzboiz', 0, 130);

  // Badge GPA 3.43 / 4.0
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(canvas.width - 320, 15, 230, 44);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GPA 3.43 / 4.0 · XUẤT SẮC', canvas.width - 205, 42);
  ctx.restore();

  // Đường kẻ phân cách
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(68, 240);
  ctx.lineTo(canvas.width - 68, 240);
  ctx.stroke();

  // Helper vẽ tiêu đề mục
  let curY = 275;
  const drawSectionTitle = (title: string) => {
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, 68, curY);

    ctx.strokeStyle = '#e05a47';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(68, curY + 6);
    ctx.lineTo(68 + ctx.measureText(title).width + 20, curY + 6);
    ctx.stroke();
    curY += 34;
  };

  // Helper vẽ đoạn văn bản
  const drawText = (text: string, fontSize = 15, color = '#334155', isBold = false) => {
    ctx.fillStyle = color;
    ctx.font = `${isBold ? 'bold ' : ''}${fontSize}px "Segoe UI", Arial, sans-serif`;
    ctx.fillText(text, 68, curY);
    curY += fontSize + 8;
  };

  // 3. MỤC 1: TÓM TẮT NĂNG LỰC
  drawSectionTitle('I. TÓM TẮT NĂNG LỰC (PROFILE SUMMARY)');
  drawText('Kỹ sư Phần mềm tốt nghiệp Đại học Công nghệ TP.HCM (HUTECH) với GPA 3.43 / 4.0 và danh hiệu Sinh viên Xuất sắc.', 15, '#1e293b');
  drawText('Sở hữu kinh nghiệm thực chiến phát triển các hệ thống Enterprise cốt lõi (MES, SCADA, PLM) tại Pungkook Saigon II', 15, '#334155');
  drawText('và xử lý dữ liệu Computer Vision tại Alchera. Đam mê kiến trúc Clean Code, đồ họa 3D WebGL / Three.js 60 FPS.', 15, '#334155');
  curY += 12;

  // 4. MỤC 2: KỸ NĂNG KỸ THUẬT CỐT LÕI
  drawSectionTitle('II. KỸ NĂNG KỸ THUẬT (TECHNICAL COMPETENCIES)');
  drawText('• Ngôn ngữ & Backend: C# .NET Core, ASP.NET MVC, Java Spring Boot, Node.js, TypeScript, Python, SQL', 15, '#0f172a', true);
  drawText('• Frontend & 3D: Three.js, React 19, Angular, GLSL Shaders, GSAP, Tailwind CSS, Zustand, Next.js', 15, '#0f172a', true);
  drawText('• CSDL & DevOps: PostgreSQL, SQL Server, Redis, Docker, CI/CD, Git, RESTful API, SCADA / MES UI', 15, '#0f172a', true);
  curY += 12;

  // 5. MỤC 3: KINH NGHIỆM LÀM VIỆC THỰC CHIẾN
  drawSectionTitle('III. KINH NGHIỆM THỰC CHIẾN (PROFESSIONAL EXPERIENCE)');

  // Job 1
  drawText('1. Pungkook Saigon II (2024 — Hiện tại) — Full-Stack & Frontend Developer', 16, '#0f172a', true);
  drawText('- Trực tiếp phát triển các phân hệ Enterprise: PLMV2, PK PLM, MES Home, SCADA UI, QA Dashboard.', 14, '#475569');
  drawText('- Thiết kế giao diện thời gian thực giám sát dây chuyền sản xuất công nghiệp, tối ưu độ trễ hiển thị dữ liệu lớn.', 14, '#475569');
  drawText('- Phối hợp liên phòng ban giữa Backend, QA và Khối sản xuất nhằm chuẩn hóa quy trình triển khai phần mềm.', 14, '#475569');
  curY += 8;

  // Job 2
  drawText('2. Alchera (2023 — 2024) — AI Data & Computer Vision Specialist', 16, '#0f172a', true);
  drawText('- Khai thác và xử lý dữ liệu Computer Vision độ chính xác cao phục vụ huấn luyện các mô hình AI thị giác máy tính.', 14, '#475569');
  drawText('- Xây dựng các phân hệ 360 Media annotation, tối ưu hóa luồng xuất file ZIP hàng loạt tự động, tăng 35% hiệu suất.', 14, '#475569');
  curY += 8;

  // Job 3
  drawText('3. Freelance & Creative Labs (2022 — 2024) — 3D Systems Engineer', 16, '#0f172a', true);
  drawText('- Đạt giải thưởng cuộc thi HDBank Hackathon với giải pháp công nghệ sáng tạo và kiến trúc backend phân tán.', 14, '#475569');
  drawText('- Xây dựng Portfolio 3D năm 1997 Procedural Three.js 60 FPS hoàn toàn bằng code, không dùng file GLB bên ngoài.', 14, '#475569');
  curY += 12;

  // 6. MỤC 4: HỌC VẤN & CHỨNG CHỈ
  drawSectionTitle('IV. HỌC VẤN & GIẢI THƯỞNG (EDUCATION & HONORS)');
  drawText('• Đại học Công nghệ TP.HCM (HUTECH) — GPA 3.43 / 4.0 | Danh hiệu Sinh viên Xuất sắc (2024–2025)', 15, '#0f172a', true);
  drawText('• Giải thưởng Sáng tạo HDBank Hackathon | Chuyên sâu Kiến trúc Microservices & Real-Time WebGL', 14, '#475569');

  // Chữ ký điện tử & Watermark dưới đáy
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'italic 12px "Times New Roman", serif';
  ctx.textAlign = 'right';
  ctx.fillText('Verified Portfolio Document · Nguyen Xuan Vinh · Canon Bubble Jet BJC-250 Print Output (1997)', canvas.width - 68, canvas.height - 58);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return texture;
}

