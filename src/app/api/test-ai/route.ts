import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  
  if (!OPENAI_API_KEY) {
    return NextResponse.json({ 
      error: 'OpenAI API key not configured',
      hasKey: false 
    }, { status: 500 })
  }

  try {
    // Test a simple OpenAI API call
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: 'Say "AI API is working" in JSON format like {"message": "AI API is working"}'
          }
        ],
        max_tokens: 50
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({
        error: 'OpenAI API failed',
        status: response.status,
        details: errorText,
        hasKey: true
      }, { status: 500 })
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    return NextResponse.json({
      success: true,
      hasKey: true,
      response: content,
      fullResponse: data
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : String(error),
      hasKey: true
    }, { status: 500 })
  }
}