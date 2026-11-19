"""Gera o ícone da família Proc-* noutra cor.

Usa o ícone do Proc-Scanner (vermelho, "p" branco com sombra) como molde, muda só a cor do fundo e
da sombra (o "p" fica branco) e escreve os três ficheiros que cada app usa:
icone.ico (16 a 256 px), icon-192.png e icon-512.png.

    py icones/mudar_cor.py "#0d9488" icones/nova-app

Precisa do Pillow (py -m pip install pillow).
"""

import colorsys
import os
import sys

from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
MOLDE = os.path.join(AQUI, "proc-scanner")
COR_MOLDE = (195, 25, 55)  # o vermelho do Proc-Scanner
TAMANHOS_ICO = [16, 24, 32, 48, 64, 72, 96, 128, 256]


def recolorir(img, cor):
    th, ts, tv = colorsys.rgb_to_hsv(*(c / 255 for c in cor))
    _, bs, bv = colorsys.rgb_to_hsv(*(c / 255 for c in COR_MOLDE))

    def pixel(p):
        r, g, b, a = p
        if a == 0:
            return p
        _, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        if s < 0.02:  # branco ou cinzento: o "p" fica igual
            return p
        w = min(1.0, s / bs)  # quanto do píxel é cor (nas bordas do "p" mistura-se com o branco)
        ns = min(1.0, s * ts / bs)
        nv = min(1.0, v * (1 - w + w * tv / bv))
        nr, ng, nb = colorsys.hsv_to_rgb(th, ns, nv)
        return (round(nr * 255), round(ng * 255), round(nb * 255), a)

    img = img.convert("RGBA")
    dados = img.get_flattened_data() if hasattr(img, "get_flattened_data") else img.getdata()
    return Image.frombytes("RGBA", img.size, bytes(c for p in dados for c in pixel(p)))


def cor_de(texto):
    texto = texto.lstrip("#")
    if len(texto) != 6:
        raise SystemExit("A cor tem de ser #rrggbb, por exemplo #0d9488")
    return tuple(int(texto[i:i + 2], 16) for i in (0, 2, 4))


def main():
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    cor, destino = cor_de(sys.argv[1]), sys.argv[2]
    os.makedirs(destino, exist_ok=True)

    for nome in ("icon-192.png", "icon-512.png"):
        recolorir(Image.open(os.path.join(MOLDE, nome)), cor).save(os.path.join(destino, nome), optimize=True)

    ico = Image.open(os.path.join(MOLDE, "icone.ico"))
    tem = {s[0] for s in ico.info["sizes"]}
    grande = recolorir(ico.ico.getimage((256, 256)), cor)
    imagens = [recolorir(ico.ico.getimage((t, t)), cor) if t in tem else grande.resize((t, t), Image.LANCZOS)
               for t in TAMANHOS_ICO]
    imagens[-1].save(os.path.join(destino, "icone.ico"), format="ICO",
                     sizes=[(t, t) for t in TAMANHOS_ICO], append_images=imagens[:-1])
    print(f"Ícones em {destino}: icone.ico, icon-192.png, icon-512.png")


if __name__ == "__main__":
    main()
