import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

type Props = {
  open: boolean;
  onClose: () => void;
  newLevel: number;
  title: string;
};

export function LevelUpModal({ open, onClose, newLevel, title }: Props) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-sm text-center">
        <DialogHeader>
          <DialogTitle className="sr-only">Level Up!</DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 10, stiffness: 100 }}
          className="py-4"
        >
          <div className="text-6xl font-black text-primary mb-2">
            {newLevel}
          </div>
          <h2 className="text-2xl font-bold mb-1">Level Up!</h2>
          <p className="text-muted-foreground">
            You are now a <span className="font-semibold">{title}</span>
          </p>
        </motion.div>

        <Button onClick={onClose} className="w-full">
          Continue
        </Button>
      </DialogContent>
    </Dialog>
  );
}
