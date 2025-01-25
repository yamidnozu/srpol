import { Grid } from '@mui/material';
import React from 'react';
import { MenuItem as MenuItemType } from '../../context/AppContext';
import MenuItem from './MenuItem';

interface MenuListProps {
  menu: MenuItemType[];
  onEdit: (item: MenuItemType) => void;
  onDelete: (item: MenuItemType) => void;
}

const MenuList: React.FC<MenuListProps> = ({ menu, onEdit, onDelete }) => {
  return (
    <Grid container spacing={2}>
      {menu.map((item) => (
        <Grid item xs={12} sm={6} md={4} key={item.id}>
          <MenuItem item={item} onEdit={onEdit} onDelete={onDelete} />
        </Grid>
      ))}
    </Grid>
  );
};

export default MenuList;