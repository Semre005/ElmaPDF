
"use client";

import { useState, useEffect } from 'react';
import { StaticCaterpillar } from "@/components/static-caterpillar";

export function InfoBubble() {
    const [infoTextIndex, setInfoTextIndex] = useState(0);

    const infoTexts = [
        "PDF özetle; Özetini Düzenle ve İndir!",
        "Test Oluştur ve Kendini Test Et!",
        "Çalışma Planı Hazırla ve Düzenli Çalış!",
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setInfoTextIndex((prevIndex) => (prevIndex + 1) % infoTexts.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [infoTexts.length]);

    return (
        <div className="mt-4 flex items-center justify-center gap-2">
            <StaticCaterpillar className="h-16 w-16" />
            <div className="relative">
                <div className="bg-destructive text-destructive-foreground rounded-lg px-4 py-2 shadow-lg w-80">
                    <p className="text-center font-semibold">{infoTexts[infoTextIndex]}</p>
                </div>
                <div className="absolute top-1/2 -left-2 transform -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-destructive"></div>
            </div>
        </div>
    );
}

    