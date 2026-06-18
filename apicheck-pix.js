export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const DUTTYFY_URL = process.env.DUTTYFY_PIX_URL_ENCRYPTED;
  const { transactionId } = req.query;

  if (!DUTTYFY_URL) {
    return res.status(500).json({ error: "URL PIX não configurada" });
  }

  if (!transactionId) {
    return res.status(400).json({ error: "transactionId obrigatório" });
  }

  try {
    const url = `${DUTTYFY_URL}?transactionId=${encodeURIComponent(transactionId)}`;

    const response = await fetch(url, {
      method: "GET"
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: "Erro ao consultar pagamento" });
  }
}