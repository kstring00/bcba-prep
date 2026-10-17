import { CRISIS_LINE, SAFETY_NOTE } from "@/lib/toolkit/config";
import styles from "./toolkit.module.css";

/**
 * On every toolkit screen, always in view: this is not therapy, and 988 is
 * one tap away. It is sticky under the header so scrolling never hides it,
 * and the number is a real link on both call and text.
 */
export function SafetyBar() {
  return (
    <div className={styles.safety} role="note" aria-label="Safety information">
      <div className={`container ${styles.safetyInner}`}>
        {/* Phones get one line, so the bar stays slim; wider screens get the
            full sentence. Both say the two things that matter. */}
        <p className={`${styles.safetyText} ${styles.safetyFull}`}>
          <strong>{SAFETY_NOTE}</strong> {CRISIS_LINE}
        </p>
        <p className={`${styles.safetyText} ${styles.safetyShort}`}>
          <strong>Not therapy.</strong> In crisis?
        </p>
        <span className={styles.safetyActions}>
          <a href="tel:988" className={styles.safetyLink}>
            Call 988
          </a>
          <a href="sms:988" className={styles.safetyLink}>
            Text 988
          </a>
        </span>
      </div>
    </div>
  );
}
