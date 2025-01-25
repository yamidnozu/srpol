import { Delete, Edit } from '@mui/icons-material';
import { Box, Card, CardActions, CardContent, CardMedia, IconButton, Typography } from '@mui/material';
import React from "react";
import { MenuItem as MenuItemType } from '../../context/AppContext';

interface MenuItemProps {
  item: MenuItemType;
  onEdit: (item: MenuItemType) => void;
  onDelete: (item: MenuItemType) => void;
}


const MenuItem: React.FC<MenuItemProps> = ({ item, onEdit, onDelete }) => {
    return (
        <Card sx={{ maxWidth: 345, minWidth: 345 }}>
            <CardMedia
                component="img"
                height="194"
                image={item.imageUrl}
                alt={item.name}
            />
            <CardContent>
                <Typography gutterBottom variant="h5" component="div">
                {item.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                 {item.description}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                 Precio: {item.price}
                </Typography>
                <Box>
                   {item.recommendation && (
                        <Typography variant="body2" color="text.secondary">
                         Recomendaciones: {item.recommendation}
                        </Typography>
                    )}
                      {item.observations && (
                        <Typography variant="body2" color="text.secondary">
                        Observaciones: {item.observations}
                        </Typography>
                    )}
                </Box>
            </CardContent>
             <CardActions sx={{justifyContent: 'flex-end'}}>
                 <IconButton onClick={() => onEdit(item)}>
                     <Edit />
                 </IconButton>
                <IconButton onClick={() => onDelete(item)}>
                    <Delete />
                </IconButton>
            </CardActions>
        </Card>
    );
};

export default MenuItem;