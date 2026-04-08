package Servie;

import Entite.Client;
import java.util.List;

public interface ClientService {
    boolean ajouterClient(Client client);
    boolean supprimerClient(int id);
    boolean modifierClient(Client client);
    Client getClientById(int id);
    List<Client> getAllClients();
    List<Client> rechercherClients(String critere);
    double calculerTotalPretsClient(int clientId);
    double calculerTauxEndettement(int clientId);
}