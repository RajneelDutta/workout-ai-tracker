import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

type XPGain = { amount: number; reason: string };

type Props = {
  gains: XPGain[];
};

export function XPPopup({ gains }: Props) {
  const [visible, setVisible] = useState(gains);

  useEffect(() => {
    setVisible(gains);
    if (gains.length > 0) {
      const timer = setTimeout(() => setVisible([]), 3000);
      return () => clearTimeout(timer);
    }
  }, [gains]);

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none">
      <AnimatePresence>
        {visible.map((gain, i) => (
          <motion.div
            key={`${gain.reason}-${i}`}
            initial={{ opacity: 0, x: 50, y: -10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: i * 0.15 }}
            className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-bold shadow-lg"
          >
            +{gain.amount} XP — {gain.reason}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
