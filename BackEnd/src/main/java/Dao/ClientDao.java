package Dao;

import Entite.Client;
import java.util.List;

public interface ClientDao {
  boolean ajouterClient(Client client);
  boolean supprimerClient(int id);
  boolean modifierClient(Client client);
  Client getClientById(int id);
  List<Client> getAllClients();
  List<Client> rechercherClients(String critere);
}