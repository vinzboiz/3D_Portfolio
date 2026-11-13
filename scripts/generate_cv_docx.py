import zipfile
import os

doc_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="52"/><w:color w:val="111111"/></w:rPr><w:t>NGUYỄN XUÂN VINH</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="E05A47"/></w:rPr><w:t>FULL-STACK &amp; FRONTEND DEVELOPER · 3D WEBGL ARCHITECT</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="20"/><w:color w:val="666666"/></w:rPr><w:t>hello@vinzboiz.dev | github.com/vinzboiz | TP. Hồ Chí Minh, Việt Nam</w:t></w:r>
    </w:p>
    <w:p/>
    <w:p>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="1E3A8A"/></w:rPr><w:t>I. TÓM TẮT NĂNG LỰC (PROFILE SUMMARY)</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>Kỹ sư Phần mềm tốt nghiệp Đại học Công nghệ TP.HCM (HUTECH) với GPA 3.43 / 4.0 và danh hiệu Sinh viên Xuất sắc (2024–2025). Có kinh nghiệm thực chiến phát triển các hệ thống Enterprise cốt lõi (MES, SCADA, PLM) tại Pungkook Saigon II và xử lý dữ liệu Computer Vision tại Alchera. Chuyên sâu đồ họa 3D WebGL / Three.js 60 FPS, kiến trúc Clean Code và tối ưu hóa hệ thống backend phân tán.</w:t></w:r>
    </w:p>
    <w:p/>
    <w:p>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="1E3A8A"/></w:rPr><w:t>II. KỸ NĂNG KỸ THUẬT (TECHNICAL SKILLS)</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>• Ngôn ngữ &amp; Backend: </w:t></w:r>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>C# .NET Core, ASP.NET MVC, Java Spring Boot, Node.js, TypeScript (Strict), Python, SQL</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>• Frontend &amp; 3D WebGL: </w:t></w:r>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>Three.js, React 19, Angular, GLSL Shaders, GSAP, Tailwind CSS, Zustand</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>• Cơ sở dữ liệu &amp; DevOps: </w:t></w:r>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>PostgreSQL, SQL Server, Redis, Docker, CI/CD, Git, RESTful API, SCADA / MES</w:t></w:r>
    </w:p>
    <w:p/>
    <w:p>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="1E3A8A"/></w:rPr><w:t>III. KINH NGHIỆM LÀM VIỆC (PROFESSIONAL EXPERIENCE)</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>1. Pungkook Saigon II (2024 — Hiện tại)</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:i/><w:sz w:val="22"/><w:color w:val="555555"/></w:rPr><w:t>Vị trí: Full-Stack &amp; Frontend Developer</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>- Trực tiếp phát triển các phân hệ Enterprise: PLMV2, PK PLM, MES Home, SCADA UI, QA Dashboard.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>- Xây dựng giao diện thời gian thực giám sát dây chuyền sản xuất công nghiệp, tối ưu hóa hiển thị dữ liệu lớn với độ trễ thấp.</w:t></w:r>
    </w:p>
    <w:p/>
    <w:p>
      <w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>2. Alchera (2023 — 2024)</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:i/><w:sz w:val="22"/><w:color w:val="555555"/></w:rPr><w:t>Vị trí: AI Data &amp; Computer Vision Specialist</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>- Xử lý dữ liệu Computer Vision độ chính xác cao phục vụ huấn luyện mô hình AI thị giác máy tính.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>- Tối ưu hóa luồng xuất file ZIP hàng loạt và kiểm soát lỗi dữ liệu tự động, nâng cao 35% hiệu suất pipeline.</w:t></w:r>
    </w:p>
    <w:p/>
    <w:p>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="1E3A8A"/></w:rPr><w:t>IV. HỌC VẤN &amp; GIẢI THƯỞNG (EDUCATION &amp; AWARDS)</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>• Đại học Công nghệ TP.HCM (HUTECH): </w:t></w:r>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>GPA 3.43 / 4.0 — Danh hiệu Sinh viên Xuất sắc (2024–2025)</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>• Giải thưởng HDBank Hackathon: </w:t></w:r>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>Giải pháp công nghệ sáng tạo và kiến trúc backend phân tán</w:t></w:r>
    </w:p>
  </w:body>
</w:document>"""

content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>"""

rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""

out_path = 'public/NguyenXuanVinh_CV.docx'
os.makedirs('public', exist_ok=True)
with zipfile.ZipFile(out_path, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('[Content_Types].xml', content_types)
    z.writestr('_rels/.rels', rels)
    z.writestr('word/document.xml', doc_xml)
print('Generated', out_path, 'size:', os.path.getsize(out_path))

