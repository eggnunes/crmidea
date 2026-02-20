
## Problema Identificado

A aba **"Agendar"** no dashboard do cliente (aba do Alan) usa um `<iframe>` interno apontando para `/agendar/{id_do_consultor}`. Esse sistema depende de horários manuais cadastrados na tabela interna — que está **vazia**. Por isso o cliente vê "Nenhum horário disponível" e ao tentar confirmar o agendamento recebe "Erro ao realizar agendamento".

Já existe na base de dados o campo `calendar_booking_url` em `consulting_settings` para guardar o link do Google Calendar. O link atual salvo é o antigo; o novo link fornecido é `https://calendar.app.google/1i61CqqTTJdwBV7a6`.

---

## Plano de Correção

### Parte 1 — Atualizar o link salvo no banco

Atualizar o registro em `consulting_settings` com o novo link:
```
https://calendar.app.google/1i61CqqTTJdwBV7a6
```

### Parte 2 — Refatorar a aba "Agendar" no dashboard do cliente

Substituir o `<iframe>` interno (que não funciona) por uma interface limpa e clara que:

1. Busca o `calendar_booking_url` da tabela `consulting_settings` (usando o `consultant_id` do perfil do cliente)
2. Exibe um **card convidativo** com botão "Agendar minha sessão →" que abre o Google Calendar Appointment em nova aba
3. Se por algum motivo o link não estiver configurado, exibe mensagem orientando o cliente a entrar em contato

**Visual da nova aba "Agendar":**
```
┌────────────────────────────────────────────────────────┐
│  📅  Agendar uma Sessão de Consultoria                  │
│                                                        │
│  Clique no botão abaixo para ver os horários           │
│  disponíveis e confirmar seu agendamento.              │
│                                                        │
│  ✓ Escolha a data e horário que melhor funciona        │
│  ✓ O link abrirá a agenda oficial de agendamento       │
│  ✓ Você receberá uma confirmação por e-mail            │
│                                                        │
│  [  🗓️  Abrir Agenda de Agendamento  →  ]              │
└────────────────────────────────────────────────────────┘
```

### Parte 3 — Atualizar `ConsultingCalendarSettings` para refletir o novo link

Garantir que o novo link `https://calendar.app.google/1i61CqqTTJdwBV7a6` seja o valor padrão exibido e editável na tela de configurações do calendário (aba Configurações da Consultoria), para facilitar atualizações futuras sem necessidade de código.

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---|---|
| `src/pages/ClientDashboardPage.tsx` | Substituir o `<iframe>` pela nova interface com botão de link externo; buscar `calendar_booking_url` de `consulting_settings` |
| `src/components/consulting/ConsultingCalendarSettings.tsx` | Atualizar o valor inicial/placeholder para o novo link |

**Nenhuma mudança de banco necessária** — o link será atualizado via código no `upsert` na inicialização, ou você pode editar diretamente na tela de configurações da consultoria após o deploy.

---

## Resultado Esperado

- Alan abre a aba "Agendar" no dashboard → vê um card bonito com botão claro
- Clica no botão → abre `https://calendar.app.google/1i61CqqTTJdwBV7a6` em nova aba
- Escolhe data e horário diretamente no Google Calendar Appointment
- Sem erros, sem iframe quebrado
- Futuramente, você pode trocar o link na tela de Configurações da Consultoria sem precisar de código
