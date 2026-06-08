export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const DUTTYFY_URL = process.env.DUTTYFY_PIX_URL_ENCRYPTED;

  if (!DUTTYFY_URL) {
    return res.status(500).json({ error: "URL PIX não configurada" });
  }

  try {
    const { amount, customer, item, utm } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ error: "Valor inválido" });
    }

    if (!customer?.name || !customer?.email || !customer?.document || !customer?.phone) {
      return res.status(400).json({ error: "Dados do cliente incompletos" });
    }

    const document = String(customer.document).replace(/\D/g, "");
    const phone = String(customer.phone).replace(/\D/g, "");

    if (![11, 14].includes(document.length)) {
      return res.status(400).json({ error: "CPF/CNPJ inválido" });
    }

    if (![10, 11].includes(phone.length)) {
      return res.status(400).json({ error: "Telefone inválido" });
    }

    const payload = {
      amount,
      customer: {
        name: customer.name,
        document,
        email: customer.email,
        phone
      },
      item: {
        title: item.title,
        price: amount,
        quantity: 1
      },
      paymentMethod: "PIX",
      utm: utm || ""
    };

    let lastError;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(DUTTYFY_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status >= 400 && response.status < 500) {
            return res.status(response.status).json(data);
          }

          lastError = data;
          await new Promise(resolve => setTimeout(resolve, [1000, 2000, 4000][attempt]));
          continue;
        }

        return res.status(200).json({
          pixCode: data.pixCode,
          transactionId: data.transactionId,
          status: data.status || "PENDING"
        });

      } catch (err) {
        lastError = err;
        await new Promise(resolve => setTimeout(resolve, [1000, 2000, 4000][attempt]));
      }
    }

    return res.status(500).json({
      error: "Erro ao gerar PIX",
      details: lastError?.message || lastError
    });

  } catch (error) {
    return res.status(500).json({ error: "Erro interno" });
  }
}