export default function handler(req, res) {
  res.setHeader("Content-Type", "text/xml");

  const twiml = `
    <Response>
      <Connect>
        <Stream url="wss://api.elevenlabs.io/v1/convai/stream/agent_5301khk6t6xwecgtmf6bz7zyx0gb">
          <Parameter name="agent_id" value="agent_5301khk6t6xwecgtmf6bz7zyx0gb" />
        </Stream>
      </Connect>
    </Response>
  `;

  res.status(200).send(twiml);
}
