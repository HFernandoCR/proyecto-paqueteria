# Guía de contribución — Equipo 6B

Este documento define **cómo trabajamos**. Léelo completo una vez antes de tomar tu primera issue. El profesor revisa el historial de Git, así que seguir esto cuenta para la calificación.

---

## Antes de empezar (una sola vez)

1. Clona el repositorio:
   ```bash
   git clone https://gitlab.itolab.lat/equipo-6b/proyecto-paqueteria.git
   cd proyecto-paqueteria
   ```
2. Configura tu identidad real (el profe revisa `git log` y debe ver tu nombre):
   ```bash
   git config user.name "Tu Nombre Completo"
   git config user.email "tu-correo@ejemplo.com"
   ```

---

## Flujo para cada issue (SIEMPRE en este orden)

### Paso 1 — Toma tu issue y créale rama

Entra a tu issue asignada en GitLab. Cada issue ya tiene escrito al final el
nombre exacto de su rama (ej: `feature/5-crud-vehiculos`).

**Crea la rama desde la propia issue** con el botón *Crear solicitud de fusión*
→ flecha → **Crear rama**. GitLab la nombra y la liga a la issue automáticamente.
Luego la traes a tu máquina:

```bash
git checkout main
git pull origin main
git fetch origin
git checkout feature/5-crud-vehiculos
```

> Alternativa: crearla a mano con `git checkout -b feature/5-crud-vehiculos`
> partiendo siempre de `main` actualizado.

### Paso 2 — Trabaja con commits pequeños y frecuentes

No dejes un solo commit gigante para el último día. Usa Conventional Commits:

```
feat(vehiculos): agregar POST /vehiculos
fix(ubicacion): corregir cálculo de bearing
docs(readme): agregar instrucciones de docker
```

Tipos válidos: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.

```bash
git add .
git commit -m "feat(vehiculos): agregar modelo Mongoose"
git push -u origin feature/5-crud-vehiculos
```

### Paso 3 — Sincroniza antes de pedir merge

```bash
git checkout main
git pull origin main
git checkout feature/5-crud-vehiculos
git merge main          # resuelve conflictos aquí, en tu rama
git push
```

### Paso 4 — Abre el Merge Request

En GitLab, abre un MR de tu rama hacia `main`. En la **descripción** escribe:

```
Closes #5
```

Eso cierra la issue automáticamente cuando se mergea.

### Paso 5 — Espera aprobación

**No mergees tu propio MR sin que un compañero lo revise.** Pídele a alguien
del equipo que lo apruebe. Solo después se mergea a `main`.

### Paso 6 — Limpia

```bash
git checkout main
git pull origin main
git branch -d feature/5-crud-vehiculos
```

---

## Tablero Kanban — mantén tu issue en el estado correcto

Arrastra tu card en el board (`Tablero de incidencias`) conforme avanzas. El
arrastre actualiza la etiqueta `status::` automáticamente.

| Cuándo | Mueve tu card a |
| --------------------------------------- | --------------------- |
| Empiezas a trabajarla                   | `status::in-progress` |
| Abres el Merge Request                  | `status::review`      |
| Se mergea y se cierra la issue          | (va a Closed solo)    |

---

## Reglas duras (no negociables)

1. **Nadie hace push directo a `main`** — todo entra por Merge Request.
2. **Cada MR vinculado a su issue** con `Closes #N`.
3. **Cada MR aprobado por al menos un compañero** (no el autor).
4. **Commits pequeños y frecuentes**, con mensajes en formato Conventional Commits.
5. **Tu nombre y correo reales** en `git config`.
6. **`git pull origin main`** antes de pedir merge; resuelve conflictos en tu rama.

---

## Nombres de rama

| Prefijo    | Uso                  | Ejemplo                          |
| ---------- | -------------------- | -------------------------------- |
| `feature/` | Nueva funcionalidad  | `feature/12-crud-vehiculos`      |
| `fix/`     | Corrección de bug    | `fix/23-bearing-mal-calculado`   |
| `docs/`    | Solo documentación   | `docs/readme-instalacion`        |

Formato: `<prefijo>/<num-issue>-<descripcion-en-kebab-case>`