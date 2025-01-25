import {
  Button,
  Container,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import PedidoForm from "../components/pedidos/PedidoForm";
import { MenuItem } from "../context/AppContext";
import { useMenu } from "../hooks/useMenu";

interface Person {
  id: string;
  name: string;
  items: { id: string; quantity: number }[];
}

const MenuPage: React.FC = () => {
  const { menu } = useMenu();
  const [numPeople, setNumPeople] = useState<number>(1);
  const [people, setPeople] = useState<Person[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [, setOpenPedidoModal] = useState(false);

  const handleNumPeopleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNumPeople(Number(event.target.value));
  };

  const handleNameChange = (index: number, value: string) => {
    const updatedPeople = [...people];
    updatedPeople[index].name = value;
    setPeople(updatedPeople);
  };

  const handleStartOrder = () => {
    const initialPeople = Array.from({ length: numPeople }, (_, index) => ({
      id: uuidv4(),
      name: `Persona ${index + 1}`,
      items: [],
    }));
    setPeople(initialPeople);
    setShowMenu(true);
  };

  const handleAddItemToPerson = (personId: string, item: MenuItem) => {
    setPeople((prevPeople) =>
      prevPeople.map((person) =>
        person.id === personId
          ? {
              ...person,
              items: [...person.items, { id: item.id, quantity: 1 }],
            }
          : person
      )
    );
  };

  const handleQuantityChange = (
    personId: string,
    itemId: string,
    quantity: number
  ) => {
    setPeople((prevPeople) =>
      prevPeople.map((person) =>
        person.id === personId
          ? {
              ...person,
              items: person.items.map((item) =>
                item.id === itemId ? { ...item, quantity: quantity } : item
              ),
            }
          : person
      )
    );
  };

  const handleRemoveItemFromPerson = (personId: string, itemId: string) => {
    setPeople((prevPeople) =>
      prevPeople.map((person) =>
        person.id === personId
          ? {
              ...person,
              items: person.items.filter((item) => item.id !== itemId),
            }
          : person
      )
    );
  };

  const handleOpenPedidoModal = () => {
    setOpenPedidoModal(true);
  };

  const handleClosePedidoModal = () => {
    setOpenPedidoModal(false);
  };

  return (
    <Container sx={{ marginY: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Menú
      </Typography>
      {!showMenu ? (
        <Grid container spacing={2} sx={{ marginBottom: 2 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Número de personas"
              type="number"
              value={numPeople}
              onChange={handleNumPeopleChange}
              fullWidth
              inputProps={{ min: 1 }}
            />
          </Grid>
          {people.map((person, index) => (
            <Grid item xs={12} sm={6} key={person.id}>
              <TextField
                label={`Nombre de la persona ${index + 1} (Opcional)`}
                value={person.name}
                onChange={(e) => handleNameChange(index, e.target.value)}
                fullWidth
              />
            </Grid>
          ))}

          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleStartOrder}
            >
              Empezar Pedido
            </Button>
          </Grid>
        </Grid>
      ) : (
        <>
          <Grid container spacing={2}>
            {people.map((person) => (
              <Grid item xs={12} md={4} key={person.id}>
                <Typography variant="h6">
                  {person.name || "Persona sin nombre"}
                </Typography>
                <Typography variant="body2">
                  Items:
                </Typography>
                  {person.items.length > 0 ? (
                    <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
                      {person.items.map((item) => {
                        const menuItem = menu.find((menuItem) => menuItem.id === item.id)
                        return menuItem ?(
                          <li key={item.id}>
                            <Typography variant="body2">
                            {menuItem.name} x{" "}
                            <TextField
                            type="number"
                            value={item.quantity}
                              onChange={(e) =>
                                handleQuantityChange(
                                    person.id,
                                  item.id,
                                  parseInt(e.target.value)
                              )}
                                sx={{ width: '60px' }}
                                inputProps={{ min: 1 }}
                              />
                            <Button
                                  variant="outlined"
                                  color="secondary"
                                  onClick={() =>
                                    handleRemoveItemFromPerson(person.id, item.id)
                                  }
                                sx={{ marginLeft: 2, padding: '2px 5px', minWidth: 'auto' }}
                              >
                                  Eliminar
                                </Button>
                          </Typography>
                          </li>
                        ): null
                    })}
                    </ul>
                  ) : (
                      <Typography variant="body2">
                          Esta persona aun no tiene items
                      </Typography>
                  )}
                <Typography variant="body2">
                  Menu:
                </Typography>

                  <Grid container spacing={2}>
                      {menu.map((item) => (
                        <Grid item xs={12} sm={6} md={12} key={item.id}>
                            <Button
                                variant="outlined"
                                color="primary"
                              onClick={() => handleAddItemToPerson(person.id, item)}
                              >
                                {item.name}
                              </Button>
                        </Grid>
                      ))}
                  </Grid>
              </Grid>
            ))}
          </Grid>
           <Button
            variant="contained"
            color="primary"
            onClick={handleOpenPedidoModal}
          >
            Realizar Pedido
          </Button>
           <PedidoForm onClose={handleClosePedidoModal} people={people} />
        </>
      )}
    </Container>
  );
};

export default MenuPage;