import type { Metadata } from "next";
import "./globals.css";
import ClientBody from "@/components/ClientBody";

export const metadata: Metadata = {
  title: "Find Blue — 블루오션을 찾는 가장 정밀한 방법",
  description:
    "소비 × 유동인구 × 소득 × 부동산 × 교통 × 이사수요 6종 데이터를 결합한 상권-주거 미스매치 분석으로 창업 및 부동산 블루오션을 발견하세요.",
  keywords: ["블루오션", "창업", "상권분석", "미스매치", "부동산", "데이터분석"],
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <ClientBody>{children}</ClientBody>
      </body>
    </html>
  );
}
