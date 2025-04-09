import "./style.css";
import { useEffect, useRef } from "react";
import qrcode from "qrcode";

const QRCode = ({ url, onClose }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (canvasRef.current && url) {
            qrcode.toCanvas(canvasRef.current, url, { width: 200 }, (error) => {
                if (error) {
                    console.error(error);
                }
            });
        }
    }, [url]);

    return (
        <div className="qrcode-background" onClick={onClose}>
            <div className="qrcode-modal" onClick={e => e.stopPropagation()}>
                <h2>Scan QR Code</h2>
                <canvas ref={canvasRef}></canvas>
                <div className="btn-container">
                    <button onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default QRCode;
