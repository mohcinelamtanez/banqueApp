package Servie;

import Dao.ClientDao;
import Dao.ClientDaoImpl;
import Dao.PretDao;
import Dao.PretDaoImpl;
import Entite.Client;
import Entite.Pret;
import java.util.List;

public class ClientServiceImpl implements Servie.ClientService {

    private ClientDao clientDao = new ClientDaoImpl();
    private PretDao pretDao = new PretDaoImpl();

    @Override
    public boolean ajouterClient(Client client) {
        return clientDao.ajouterClient(client);
    }

    @Override
    public boolean supprimerClient(int id) {
        // D'abord supprimer tous les prêts du client
        List<Pret> pretsClient = pretDao.getPretsByClientId(id);
        for (Pret pret : pretsClient) {
            pretDao.supprimerPret(pret.getId());
        }

        // Puis supprimer le client
        return clientDao.supprimerClient(id);
    }

    @Override
    public boolean modifierClient(Client client) {
        return clientDao.modifierClient(client);
    }

    @Override
    public Client getClientById(int id) {
        return clientDao.getClientById(id);
    }

    @Override
    public List<Client> getAllClients() {
        return clientDao.getAllClients();
    }

    @Override
    public List<Client> rechercherClients(String critere) {
        return clientDao.rechercherClients(critere);
    }

    @Override
    public double calculerTotalPretsClient(int clientId) {
        List<Pret> prets = pretDao.getPretsByClientId(clientId);
        double total = 0;
        for (Pret pret : prets) {
            total += pret.getMontantPret();
        }
        return total;
    }

    @Override
    public double calculerTauxEndettement(int clientId) {
        Client client = clientDao.getClientById(clientId);
        if (client == null || client.getRevenue() <= 0) {
            return 0;
        }

        List<Pret> prets = pretDao.getPretsByClientId(clientId);
        double totalMensualites = 0;
        for (Pret pret : prets) {
            if (!pret.getStatut().name().equals("Refuse")) {
                totalMensualites += pret.getMensualite();
            }
        }

        return (totalMensualites / client.getRevenue()) * 100;
    }
}