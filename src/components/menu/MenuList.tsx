/* src\components\menu\MenuList.tsx */
import React from "react";
import { MenuItem as MenuItemType } from "../../context/AppContext";
import MenuItemComponent from "./MenuItem";

interface MenuListProps {
  menu: MenuItemType[];
  onEdit: (item: MenuItemType) => void;
  onDelete: (item: MenuItemType) => Promise<void>;
}

const MenuList: React.FC<MenuListProps> = ({ menu, onEdit, onDelete }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"> {/* Grid responsive para la lista */}
      {menu.map((item) => (
        <MenuItemComponent key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
};

export default MenuList;