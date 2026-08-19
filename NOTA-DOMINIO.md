# Dominio en pausa

`CNAME` está renombrado a `CNAME.pendiente-dominio-pagado` a propósito.

Con el archivo `CNAME` presente, GitHub Pages redirige el link de vista previa
(`https://ricardojosemarinespitia-netizen.github.io/sitio-vegas-del-verde/`)
hacia `vegasdelverde.com` — y ese dominio hoy solo muestra la página de
aparcamiento del registrador, no el sitio. El link de vista previa quedaba
roto.

**Cuando el dominio esté pagado y apuntando por DNS a GitHub Pages:**

```bash
mv CNAME.pendiente-dominio-pagado CNAME
git add CNAME NOTA-DOMINIO.md
git rm NOTA-DOMINIO.md
git commit -m "Activar dominio propio vegasdelverde.com"
git push
```
