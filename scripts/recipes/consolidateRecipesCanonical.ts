import { db } from './firebaseAdmin';
import { canonicalKeyFromTitle } from './importWikilivrosBrasil';

function uniqByJson<T>(arr: T[]) {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const x of arr || []) {
    const k = JSON.stringify(x);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

export async function main() {
  const snap = await db.collection('recipes').get();
  const docs = snap.docs.map(d => ({ id: d.id, data: d.data() as any }));

  const groups = new Map<string, typeof docs>();
  for (const d of docs) {
    const key = d.data.canonicalKey || canonicalKeyFromTitle(d.data.title || d.id);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(d);
  }

  console.log(`Total docs: ${docs.length} | grupos por canonicalKey: ${groups.size}`);

  let batch = db.batch();
  let ops = 0;

  for (const [key, arr] of groups) {
    // escolhe “melhor” doc: prioriza o que tiver imageUrl e mais steps
    const sorted = [...arr].sort((a, b) => {
      const ai = a.data.imageUrl ? 1 : 0;
      const bi = b.data.imageUrl ? 1 : 0;
      if (ai !== bi) return bi - ai;
      const as = (a.data.steps?.length || 0);
      const bs = (b.data.steps?.length || 0);
      return bs - as;
    });

    const keep = sorted[0];
    const others = sorted.slice(1);

    const merged = { ...keep.data };
    merged.canonicalKey = key;
    merged.id = key; // id canônico dentro do doc (opcional)

    merged.sources = uniqByJson([...(keep.data.sources || []), ...others.flatMap(o => o.data.sources || [])]);
    merged.aliases = Array.from(new Set([keep.data.title, ...(keep.data.aliases || []), ...others.map(o => o.data.title)].filter(Boolean)));

    // mantém steps/ingredients mais completos
    for (const o of others) {
      if ((o.data.steps?.length || 0) > (merged.steps?.length || 0)) merged.steps = o.data.steps;
      if ((o.data.ingredients?.length || 0) > (merged.ingredients?.length || 0)) merged.ingredients = o.data.ingredients;
      if (!merged.imageUrl && o.data.imageUrl) merged.imageUrl = o.data.imageUrl;
      if (!merged.description && o.data.description) merged.description = o.data.description;
    }

    const targetRef = db.collection('recipes').doc(key);
    batch.set(targetRef, merged, { merge: true });
    ops++;

    for (const o of others) {
      const oldRef = db.collection('recipes').doc(o.id);
      if (o.id !== key) {
        batch.delete(oldRef);
        ops++;
      }
    }

    if (ops >= 400) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }

  if (ops > 0) await batch.commit();
  console.log('Consolidação concluída.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
