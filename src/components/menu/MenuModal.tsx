import { Box, Modal, } from '@mui/material';
import React from 'react';
import { MenuItem } from '../../context/AppContext';
import MenuForm from '../forms/MenuForm';

interface MenuModalProps {
  open: boolean;
  onClose: () => void;
  initialValues?: Partial<MenuItem>;
  onSubmit: (values: Partial<MenuItem>) => void
}

const style = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 600,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    outline: 'none'
};

const MenuModal: React.FC<MenuModalProps> = ({ open, onClose, initialValues, onSubmit }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <MenuForm initialValues={initialValues} onSubmit={onSubmit} />
      </Box>
    </Modal>
  );
};

export default MenuModal;