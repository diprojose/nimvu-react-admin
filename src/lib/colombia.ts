import colombiaData from '@/assets/colombia.min.json';

/**
 * Departamentos y ciudades de Colombia para los selects de dirección.
 *
 * `src/assets/colombia.min.json` es el mismo archivo que la tienda tiene en
 * `nimvu-store/data/colombia.min.json`, copiado porque son repos separados y no
 * hay paquete compartido donde ponerlo. Importa que no se separen: el backend
 * busca la tarifa de envío por nombre de departamento y ciudad, así que un
 * "Bogota" sin tilde no encuentra la tarifa de "Bogotá".
 *
 * Aquí viven las funciones compartidas; `ShippingRateForm` ya usaba el mismo
 * dataset por su cuenta y puede migrar a estas cuando se toque.
 */
interface Department {
  id: number;
  departamento: string;
  ciudades: string[];
}

const data = colombiaData as Department[];

/** Departamentos en orden alfabético, como los muestra la tienda. */
export const departments: string[] = [...data]
  .map((d) => d.departamento)
  .sort((a, b) => a.localeCompare(b, 'es'));

/** Ciudades del departamento, ya ordenadas en el dataset. Vacío si no existe. */
export function citiesOf(department: string): string[] {
  if (!department) return [];
  return data.find((d) => d.departamento === department)?.ciudades ?? [];
}

/**
 * Compara ignorando tildes, mayúsculas y espacios de sobra: así "bogota" y
 * "MEDELLIN" encuentran a "Bogotá" y "Medellín". No intenta adivinar más que
 * eso, de modo que algo como "Bogota D.C." sigue sin resolverse y hay que
 * elegirlo a mano.
 */
function loosely(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Lleva un par departamento/ciudad escrito a mano a los nombres exactos del
 * dataset, para que los selects lo reconozcan y la tarifa de envío calce.
 * Devuelve `null` en el campo que no se pueda resolver: quien edite tendrá que
 * elegirlo de la lista, que es justamente lo que evita el error de dedo.
 */
export function canonicalizeLocation(
  department: string | undefined | null,
  city: string | undefined | null,
): { department: string | null; city: string | null } {
  const match = department
    ? data.find((d) => loosely(d.departamento) === loosely(department))
    : undefined;

  if (!match) return { department: null, city: null };

  const cityMatch = city
    ? match.ciudades.find((c) => loosely(c) === loosely(city))
    : undefined;

  return { department: match.departamento, city: cityMatch ?? null };
}
