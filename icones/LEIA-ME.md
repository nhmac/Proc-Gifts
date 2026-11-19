# Ícones da família Proc-*

Todas as apps usam o mesmo "p" branco com sombra longa. Cada uma tem a sua cor de fundo.

![Família](familia.png)

| App | Cor | Pasta |
|---|---|---|
| Proc-Scanner | vermelho `#c31937` | `proc-scanner/` |
| Proc-Separador | amarelo `#dbd136` (com o "p" branco desde a 1.8.1) | `proc-separador/` |
| Proc-Batches | azul-violeta, em degradê | `proc-batches/` |
| Proc-Triagem | verde-azulado `#0d9488` | `proc-triagem/` |

Cada pasta tem os três ficheiros que a app usa: `icone.ico` (separador do browser e Windows),
`icon-192.png` e `icon-512.png` (app instalada).

**Isto é uma coleção de cópias.** O ícone que cada app usa de facto é o que está no repositório dela
(`icone.ico` na raiz e `web/icon-*.png`). Se o ícone de uma app mudar, copiar os três ficheiros para aqui
também.

## Cores por usar

Em `por-usar/` ficam as outras cores experimentadas para o Proc-Triagem (verde `#168c48`, laranja
`#ea6c14`, roxo `#7c3ac8`). Servem para uma app nova.

## Fazer um ícone noutra cor

```
py icones/mudar_cor.py "#7c3ac8" icones/nova-app
```

Usa o ícone do Proc-Scanner como molde, muda só a cor do fundo e da sombra e escreve os três ficheiros na
pasta indicada. Depois é copiá-los para o repositório da app nova (`icone.ico` na raiz e os PNG em `web/`).
Precisa do Pillow (`py -m pip install pillow`). O Proc-Batches tem um degradê, por isso não sai deste
script.
