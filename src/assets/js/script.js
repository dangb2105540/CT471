 // Log to check JavaScript loading
 console.log("Mã JavaScript đã tải");

 // Speech recognition setup
 const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
 if (SpeechRecognition) {
     const recognition = new SpeechRecognition();
     recognition.lang = 'vi-VN';
     recognition.interimResults = false;
     recognition.maxAlternatives = 1;


     document.addEventListener('DOMContentLoaded', () => {
         document.querySelectorAll('.mic-btn').forEach(button => {
             button.addEventListener('click', () => {
                 const targetId = button.getAttribute('data-target');
                 const targetInput = document.querySelector(`input.${targetId}, textarea.${targetId}`);

                 if (!targetInput) {
                     console.error(`Không tìm thấy ô nhập liệu với class: ${targetId}`);
                     alert(`Không tìm thấy ô nhập liệu với class: ${targetId}`);
                     return;
                 }

                 button.classList.add('listening');
                 recognition.start();

                 recognition.onresult = (event) => {
                     const transcript = event.results[0][0].transcript;
                     targetInput.value = transcript;
                     button.classList.remove('listening');
                 };

                 recognition.onerror = (event) => {
                     console.error('Lỗi nhận diện giọng nói:', event.error);
                     button.classList.remove('listening');
                     alert('Lỗi nhận diện giọng nói: ' + event.error);
                 };

                 recognition.onend = () => {
                     button.classList.remove('listening');
                 };
             });
         });
     });
 } else {
     console.warn('Web Speech API không được hỗ trợ trong trình duyệt này.');
     document.addEventListener('DOMContentLoaded', () => {
         document.querySelectorAll('.mic-btn').forEach(button => {
             button.disabled = true;
             button.title = 'Chức năng nhập liệu bằng giọng nói không được hỗ trợ';
         });
     });
 }

 // QR Code scanning functionality
 let qrScanner = null;
 const statusElement = document.getElementById("qr-status");
 const resultElement = document.getElementById("qr-raw-result");

 function sanitizeInput(input) {
     const div = document.createElement('div');
     div.textContent = input;
     return div.innerHTML;
 }

 function parseQRData(raw) {
     if (!raw || typeof raw !== 'string') {
         console.error("Dữ liệu QR không hợp lệ");
         return {};
     }

     const parts = raw.split("|");
     if (parts.length < 5) {
         console.error("Dữ liệu QR không đầy đủ");
         return {};
     }

     const dob = parts[3] || "";
     let age = "";
     if (dob.length === 8 && /^\d{8}$/.test(dob)) {
         try {
             const birthYear = parseInt(dob.slice(4));
             const birthMonth = parseInt(dob.slice(2, 4));
             const birthDay = parseInt(dob.slice(0, 2));
             const today = new Date();
             age = today.getFullYear() - birthYear -
                 ((today.getMonth() + 1 < birthMonth ||
                     (today.getMonth() + 1 === birthMonth && today.getDate() < birthDay)) ? 1 : 0);
         } catch (e) {
             console.error("Lỗi khi phân tích ngày sinh:", e);
         }
     }

     return {
         cccd: sanitizeInput(parts[0] || ""),
         id: sanitizeInput(parts[1] || ""),
         name: sanitizeInput(parts[2] || ""),
         age: age,
         gender: sanitizeInput((parts[4] || "").toLowerCase()),
         address: sanitizeInput(parts[5] || ""),
         issued_date: sanitizeInput(parts[6] || "")
     };
 }

 function autoFillForm(data, source = "unknown") {
     console.log(`Điền biểu mẫu từ nguồn: ${source}`);
     const fields = [{
         label: "Họ và tên",
         key: "name",
         target: "name-input"
     }, {
         label: "Tuổi",
         key: "age",
         target: "age-input"
     }, {
         label: "Địa chỉ",
         key: "address",
         target: "address-input"
     }];

     fields.forEach(field => {
         const input = document.querySelector(`input.${field.target}`);
         if (input) input.value = data[field.key] || "";
     });

     document.querySelectorAll('input[type="checkbox"]').forEach(input => {
         const labelText = input.previousSibling ? input.previousSibling.textContent.trim() : "";
         if (labelText.includes("Nam")) input.checked = data.gender === "nam";
         if (labelText.includes("Nữ")) input.checked = data.gender === "nữ";
     });

     const now = new Date();
     const hours = String(now.getHours()).padStart(2, '0');
     const minutes = String(now.getMinutes()).padStart(2, '0');
     const day = String(now.getDate()).padStart(2, '0');
     const month = String(now.getMonth() + 1).padStart(2, '0');
     const year = String(now.getFullYear());

     const timeInputs1 = document.querySelectorAll('table[style*="padding-top: 0px"] th:nth-child(1) .time-input');
     const timeInputs2 = document.querySelectorAll('table[style*="padding-top: 0px"] th:nth-child(2) .time-input');

     if (timeInputs1.length >= 4) {
         timeInputs1[0].value = hours; // time1-hour
         timeInputs1[1].value = minutes; // time1-minute
         timeInputs1[2].value = day; // time1-day
         timeInputs1[3].value = month; // time1-month
         timeInputs1[4].value = year; // time1-year
         console.log(`Đã điền timeInputs1 (${source}):`, hours, minutes, day, year);
     } else {
         console.error(`Không đủ trường thời gian trong th:nth-child(1) (${source}):`, timeInputs1.length);
     }

     if (timeInputs2.length >= 4) {
         timeInputs2[0].value = hours; // time2-hour
         timeInputs2[1].value = minutes; // time2-minute
         timeInputs2[2].value = day; // time2-day
         timeInputs2[3].value = month; // time2-month
         timeInputs2[4].value = year; // time2-year
         console.log(`Đã điền timeInputs2 (${source}):`, hours, minutes, day, year);
     } else {
         console.error(`Không đủ trường thời gian trong th:nth-child(2) (${source}):`, timeInputs2.length);
     }

     if (statusElement) {
         statusElement.innerText = `Quét QR từ ${source} thành công!`;
         statusElement.style.color = "green";
     }
 }

 function scanQRCodeFromFile() {
     const fileInput = document.getElementById("qr-file-input");
     if (!fileInput || fileInput.files.length === 0) {
         console.error("Không có file được chọn");
         alert("Vui lòng chọn ảnh chứa mã QR!");
         return;
     }

     const file = fileInput.files[0];
     console.log("Đã chọn file:", file.name);
     const qrScanner = new Html5Qrcode("qr-reader-temp");

     qrScanner.scanFile(file, true)
         .then(decodedText => {
             console.log("Đã quét được từ ảnh:", decodedText);
             if (resultElement) {
                 resultElement.innerText = "Dữ liệu QR: " + decodedText;
             }
             const data = parseQRData(decodedText);
             autoFillForm(data, "file");
             qrScanner.clear();
         })
         .catch(err => {
             console.error("Không đọc được mã QR từ ảnh:", err);
             alert("Không đọc được mã QR từ ảnh, kiểm tra lại!");
             if (statusElement) {
                 statusElement.innerText = "Lỗi: Không đọc được mã QR từ ảnh.";
                 statusElement.style.color = "red";
             }
         });
 }

 function startCameraScan() {
     if (qrScanner) {
         if (statusElement) {
             statusElement.innerText = "Camera đã được khởi động. Đưa mã QR vào khung.";
             statusElement.style.color = "blue";
         }
         return;
     }

     qrScanner = new Html5Qrcode("qr-reader-camera");
     if (statusElement) {
         statusElement.innerText = "Đang khởi động camera... Đưa mã QR vào khung.";
         statusElement.style.color = "blue";
     }

     const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
     const fps = isLowEndDevice ? 30 : 60;
     const supportsBarcodeDetector = 'BarcodeDetector' in window;

     Html5Qrcode.getCameras().then(devices => {
         if (devices && devices.length) {
             const cameraId = devices[0].id;

             navigator.mediaDevices.getUserMedia({
                 video: {
                     deviceId: cameraId
                 }
             }).then(stream => {
                 if (stream.getVideoTracks()[0].getCapabilities().torch) {
                     stream.getVideoTracks()[0].applyConstraints({
                         advanced: [{
                             torch: true
                         }]
                     }).catch(err => console.warn("Không thể bật flash:", err));
                 }
             });

             qrScanner.start(
                 cameraId, {
                     fps: fps,
                     qrbox: {
                         width: 180,
                         height: 180
                     },
                     aspectRatio: 1.0,
                     disableFlip: false,
                     useBarCodeDetectorIfSupported: true,
                     videoConstraints: {
                         width: {
                             ideal: 640
                         },
                         height: {
                             ideal: 480
                         }
                     },
                     experimentalFeatures: {
                         useBarCodeDetectorIfSupported: true
                     }
                 },
                 (decodedText) => {
                     console.log(`Quét thành công từ camera (FPS: ${fps}):`, decodedText);
                     if (resultElement) {
                         resultElement.innerText = "Dữ liệu QR: " + decodedText;
                     }
                     const data = parseQRData(decodedText);
                     autoFillForm(data, "camera");
                     qrScanner.stop().then(() => {
                         qrScanner.clear();
                         qrScanner = null;
                         if (statusElement) {
                             statusElement.innerText = "Quét QR từ camera thành công! Camera đã tắt.";
                             statusElement.style.color = "green";
                         }
                     }).catch(err => {
                         console.error("Lỗi khi dừng camera sau quét:", err);
                         if (statusElement) {
                             statusElement.innerText = "Lỗi: Không thể dừng camera sau khi quét.";
                             statusElement.style.color = "red";
                         }
                     });
                 },
                 (error) => {
                     if (statusElement) {
                         statusElement.innerText = "Đang tìm mã QR... Đưa mã QR vào khung.";
                         statusElement.style.color = "blue";
                     }
                     setTimeout(() => {
                         if (qrScanner && statusElement && statusElement.innerText.includes("Đang tìm mã QR")) {
                             statusElement.innerText = "Mã QR không rõ, đưa gần hơn hoặc cải thiện ánh sáng.";
                             statusElement.style.color = "orange";
                         }
                     }, 3000);
                 }
             ).catch(err => {
                 console.error("Lỗi khi khởi động camera:", err);
                 if (statusElement) {
                     statusElement.innerText = "Lỗi: Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.";
                     statusElement.style.color = "red";
                 }
             });

             if (supportsBarcodeDetector) {
                 const barcodeDetector = new BarcodeDetector({
                     formats: ['qr_code']
                 });
                 const video = document.querySelector('#qr-reader-camera video');
                 if (video) {
                     const canvas = document.createElement('canvas');
                     const ctx = canvas.getContext('2d');
                     canvas.width = 640;
                     canvas.height = 480;

                     const detectQR = () => {
                         if (!qrScanner) return;
                         ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                         barcodeDetector.detect(canvas)
                             .then(codes => {
                                 if (codes.length > 0) {
                                     console.log("BarcodeDetector quét thành công:", codes[0].rawValue);
                                     if (resultElement) {
                                         resultElement.innerText = "Dữ liệu QR (BarcodeDetector): " + codes[0].rawValue;
                                     }
                                     const data = parseQRData(codes[0].rawValue);
                                     autoFillForm(data, "barcode-detector");
                                     qrScanner.stop().then(() => {
                                         qrScanner.clear();
                                         qrScanner = null;
                                         if (statusElement) {
                                             statusElement.innerText = "Quét QR từ barcode-detector thành công! Camera đã tắt.";
                                             statusElement.style.color = "green";
                                         }
                                     }).catch(err => {
                                         console.error("Lỗi khi dừng camera sau quét (BarcodeDetector):", err);
                                         if (statusElement) {
                                             statusElement.innerText = "Lỗi: Không thể dừng camera sau khi quét.";
                                             statusElement.style.color = "red";
                                         }
                                     });
                                 }
                             })
                             .catch(err => console.warn("BarcodeDetector lỗi:", err));
                         requestAnimationFrame(detectQR);
                     };
                     requestAnimationFrame(detectQR);
                 }
             }
         } else {
             if (statusElement) {
                 statusElement.innerText = "Lỗi: Không tìm thấy camera.";
                 statusElement.style.color = "red";
             }
         }
     }).catch(err => {
         console.error("Lỗi khi liệt kê camera:", err);
         if (statusElement) {
             statusElement.innerText = "Lỗi: Không thể liệt kê camera. Vui lòng kiểm tra thiết bị.";
             statusElement.style.color = "red";
         }
     });
 }

 function stopCameraScan() {
     if (qrScanner) {
         qrScanner.stop().then(() => {
             if (statusElement) {
                 statusElement.innerText = "Camera đã được tắt.";
                 statusElement.style.color = "black";
             }
             qrScanner.clear();
             qrScanner = null;
         }).catch(err => {
             console.error("Lỗi khi dừng camera:", err);
             if (statusElement) {
                 statusElement.innerText = "Lỗi: Không thể dừng camera.";
                 statusElement.style.color = "red";
             }
         });
     } else {
         if (statusElement) {
             statusElement.innerText = "Camera chưa được khởi động.";
             statusElement.style.color = "black";
         }
     }
 }

 document.addEventListener('DOMContentLoaded', () => {
     console.log("DOMContentLoaded triggered");
     const cameraBtn = document.getElementById('scan-camera');
     const stopCameraBtn = document.getElementById('stop-camera');
     const scanFileBtn = document.getElementById('scan-file');

     if (cameraBtn) {
         cameraBtn.addEventListener('click', startCameraScan);
     } else {
         console.error("Không tìm thấy nút scan-camera");
     }
     if (stopCameraBtn) {
         stopCameraBtn.addEventListener('click', stopCameraScan);
     } else {
         console.error("Không tìm thấy nút stop-camera");
     }
     if (scanFileBtn) {
         scanFileBtn.addEventListener('click', scanQRCodeFromFile);
     } else {
         console.error("Không tìm thấy nút scan-file");
     }
 });