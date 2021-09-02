// Note: this file was stolen from fp-ts package, but was significantly simplified
// Type defunctionalization (as describe in [Lightweight higher-kinded polymorphism](https://www.cl.cam.ac.uk/~jdy22/papers/lightweight-higher-kinded-polymorphism.pdf))

export interface TypeIdToTypeMap<A> { }
export type TypeIds = keyof TypeIdToTypeMap<any>
export type MakeType<TypeId extends TypeIds, TypeArg1>
    = TypeIdToTypeMap<TypeArg1>[TypeId];