import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import React, { useState } from "react";

interface JoinOrderModalProps {
  open: boolean;
  onClose: () => void;
  onJoinOrder: (code: string) => void;
}

const JoinOrderModal: React.FC<JoinOrderModalProps> = ({
  open,
  onClose,
  onJoinOrder,
}) => {
  const [code, setCode] = useState("");

  const handleJoin = () => {
    onJoinOrder(code);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Unirse a Pedido Compartido</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="code"
          label="Código del pedido"
          type="text"
          fullWidth
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancelar
        </Button>
        <Button onClick={handleJoin} color="primary">
          Unirme
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default JoinOrderModal;
