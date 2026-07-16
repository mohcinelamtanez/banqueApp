// RiskService.java*
package Servie;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import okhttp3.*;

import java.io.IOException;

public class RiskService {
    private static final String RISK_API_URL = "http://127.0.0.1:5000/predict";
    private static final OkHttpClient client = new OkHttpClient();
    private static final Gson gson = new Gson();

    public static JsonObject calculerRisk(double revenu, double remboursement, int duree, double taux) throws IOException {
        JsonObject jsonBody = new JsonObject();
        jsonBody.addProperty("revenu", revenu);
        jsonBody.addProperty("remboursement", remboursement);
        jsonBody.addProperty("duree", duree);
        jsonBody.addProperty("taux", taux);

        RequestBody body = RequestBody.create(
                gson.toJson(jsonBody),
                MediaType.parse("application/json")
        );

        Request request = new Request.Builder()
                .url(RISK_API_URL)
                .post(body)
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Erreur API Risk: " + response);
            }
            return gson.fromJson(response.body().string(), JsonObject.class);
        }
    }
}
