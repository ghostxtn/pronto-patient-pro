import { motion } from "framer-motion";
import SmartLink from "./SmartLink";

type HeroDoctor = {
  id: string;
  name: string;
  title: string;
};

type HeroSectionProps = {
  doctors: HeroDoctor[];
};

const sectionMotionProps = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.55, ease: "easeOut" as const },
};

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function HeroSection({ doctors }: HeroSectionProps) {
  return (
    <motion.section
      {...sectionMotionProps}
      style={{ minHeight: "100vh", display: "flex", alignItems: "stretch", paddingTop: "68px" }}
    >
      <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "48px 64px" }}>
        <div style={{ maxWidth: 520 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#eaf5ff",
              border: "0.5px solid #b5d1cc",
              borderRadius: 999,
              padding: "5px 14px 5px 8px",
              fontSize: 11,
              color: "#2f75ca",
              fontWeight: 500,
              marginBottom: 28,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#4f8fe6",
                display: "inline-block",
              }}
            />
            Modern klinik yönetimi
          </div>

          <h1
            style={{
              fontFamily: "Manrope, sans-serif",
              fontSize: 52,
              fontWeight: 300,
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              color: "#1a2e3b",
              marginBottom: 20,
            }}
          >
            Sağlığınız için <span style={{ fontWeight: 700, color: "#4f8fe6" }}>doğru adres.</span>
          </h1>

          <p style={{ fontSize: 16, color: "#5a7a8a", lineHeight: 1.65, marginBottom: 36 }}>
            Antalya&apos;nın merkezinde, uzman doktorlarımız ve kişiselleştirilmiş sağlık
            hizmetlerimizle yanınızdayız. Randevu almak hiç bu kadar kolay olmamıştı.
          </p>

          <div style={{ display: "flex", gap: 12 }}>
            <SmartLink
              href="/request-appointment"
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: "#4f8fe6",
                color: "white",
                borderRadius: 999,
                padding: "12px 24px",
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(79,143,230,0.3)",
              }}
            >
              Randevu Al →
            </SmartLink>
            <SmartLink
              href="#doktorlarimiz"
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: "white",
                color: "#1a2e3b",
                borderRadius: 999,
                padding: "12px 24px",
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
                border: "0.5px solid #b5d1cc",
              }}
            >
              Doktorlarımız
            </SmartLink>
          </div>
        </div>
      </div>

      <div
        style={{
          width: "44%",
          margin: "12px 12px 12px 0",
          borderRadius: 28,
          overflow: "hidden",
          position: "relative",
          background: "linear-gradient(145deg, #c8e6f5 0%, #b5d1cc 40%, #9ecfbd 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-10%",
            left: "-10%",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "#4f8fe6",
            opacity: 0.18,
            filter: "blur(80px)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-5%",
            right: "-10%",
            width: 350,
            height: 350,
            borderRadius: "50%",
            background: "#236a53",
            opacity: 0.15,
            filter: "blur(90px)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "40px 32px",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <p
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(26,46,59,0.45)",
                marginBottom: 4,
              }}
            >
              Canlı Takip
            </p>
            <h3
              style={{
                fontFamily: "Manrope, sans-serif",
                fontSize: 20,
                fontWeight: 600,
                color: "rgba(26,46,59,0.8)",
                letterSpacing: "-0.02em",
              }}
            >
              Doktorlarımız
            </h3>
          </div>

          <div
            style={{
              width: "90%",
              maxWidth: 300,
              background: "rgba(255,255,255,0.22)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.45)",
              borderRadius: 20,
              padding: "20px",
              boxShadow: "0 8px 32px rgba(8,30,42,0.10)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 8,
                marginBottom: 16,
              }}
            >
              {[["2.4k", "Hasta"], ["98%", "Memnuniyet"], ["7/24", "Destek"]].map(([val, lbl]) => (
                <div
                  key={lbl}
                  style={{
                    background: "rgba(255,255,255,0.30)",
                    border: "1px solid rgba(255,255,255,0.4)",
                    borderRadius: 12,
                    padding: "10px 6px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "Manrope, sans-serif",
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#081e2a",
                    }}
                  >
                    {val}
                  </div>
                  <div style={{ fontSize: 10, color: "#3a5a6a", marginTop: 2 }}>{lbl}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px",
                    borderRadius: 12,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.40)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#1a2e3b",
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(doctor.name)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#081e2a",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {doctor.name}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "#3a5a6a",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {doctor.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
