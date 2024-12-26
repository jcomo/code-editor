import styles from "./page.module.css";
import { CodeEditorClient } from "./CodeEditorClient";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div
          style={{
            display: "flex",
            width: 300,
            justifyContent: "center",
            alignItems: "center",
            gap: 12,
          }}
        >
          <label style={{ fontWeight: 500 }}>Value</label>
          <CodeEditorClient />
        </div>
        <div
          style={{
            display: "flex",
            width: 300,
            justifyContent: "center",
            alignItems: "center",
            gap: 12,
          }}
        >
          <label style={{ fontWeight: 500 }}>Default</label>
          <CodeEditorClient />
        </div>
      </main>
    </div>
  );
}
