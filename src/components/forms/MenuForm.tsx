import { Button, Grid, TextField, Typography } from "@mui/material";
import React, { useState } from "react";
import { MenuItem } from "../../context/AppContext";
import { useMenu } from "../../hooks/useMenu";

interface MenuFormProps {
  initialValues?: Partial<MenuItem>;
  onSubmit: (values: Partial<MenuItem>) => void;
}

const MenuForm: React.FC<MenuFormProps> = ({ initialValues, onSubmit }) => {
  const { loading } = useMenu();
  const [name, setName] = useState(initialValues?.name || "");
  const [description, setDescription] = useState(initialValues?.description || "");
  const [price, setPrice] = useState(initialValues?.price || 0);
  const [imageUrl, setImageUrl] = useState(initialValues?.imageUrl || "");
  const [recommendation, setRecommendation] = useState(
    initialValues?.recommendation || ""
  );
  const [observations, setObservations] = useState(
    initialValues?.observations || ""
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({
      name,
      description,
      price,
      imageUrl,
      available: true,
      recommendation,
      observations,
    });
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <Typography variant="h5" sx={{ marginBottom: 2 }}>
        {initialValues?.id ? "Editar Item" : "Agregar Item"}
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Nombre del Item"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Descripción del Item"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Precio del Item"
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Url de la imagen"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Recomendaciones"
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Observaciones"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <Button type="submit" variant="contained" color="primary">
            {initialValues?.id ? "Guardar Cambios" : "Agregar Item"}
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};

export default MenuForm;