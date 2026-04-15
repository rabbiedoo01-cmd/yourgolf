exports.handler = async function(event) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if(event.httpMethod === 'OPTIONS'){
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if(event.httpMethod !== 'POST'){
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if(!apiKey){
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: { message: 'API key not configured on server' } }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch(e) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: { message: 'Invalid JSON in request body' } }) };
  }

  if(!body.messages || !Array.isArray(body.messages)){
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: { message: 'Missing messages array' } }) };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: body.messages
      })
    });

    const rawText = await response.text();

    if(!rawText || rawText.trim() === ''){
      return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: { message: 'Empty response from API' } }) };
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch(e) {
      return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: { message: 'API returned non-JSON: ' + rawText.slice(0, 200) } }) };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(data)
    };

  } catch(e) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: { message: 'Function error: ' + e.message } })
    };
  }
};
