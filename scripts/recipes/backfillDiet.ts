import { db } from './firebaseAdmin';
import { computeDietFlags } from './dietHeuristics';

function normalizeText(s: string) {
  return (s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export async function main() {
  const snap = await db.collection('recipes').get();
  console.log(`Total de receitas: ${snap.docs.length}`);

  let updated = 0;
  let skipped = 0;

  const batchSize = 400;
  let batch = db.batch();
  let ops = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data() as any;

    const ingredientNames = (data.ingredients || []).map((i: any) =>
      typeof i === 'string' ? i : (i.name || '')
    );
    const steps = (data.steps || []) as string[];

    if (ingredientNames.length === 0) {
      skipped++;
      continue;
    }

    const diet = computeDietFlags(ingredientNames, steps);

    batch.update(docSnap.ref, {
      diet,
      updatedAt: new Date().toISOString(),
    });
    ops++;
    updated++;

    if (ops >= batchSize) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
      console.log(`  Lote gravado. Total atualizado até agora: ${updated}`);
    }
  }

  if (ops > 0) await batch.commit();

  console.log(`Backfill concluído. Atualizadas: ${updated} | Puladas: ${skipped}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
