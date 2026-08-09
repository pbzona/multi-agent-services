"use client";

import { useActionState } from "react";
import { updateCartAction, type CartActionState } from "../actions/cart";
import { MinusIcon, PlusIcon } from "./icons";

const initialCartActionState: CartActionState = { message: "", ok: false };

export function AddToCartForm({
  variants,
}: {
  variants: readonly {
    availableQuantity: number;
    id: string;
    name: string;
  }[];
}) {
  const [state, action, pending] = useActionState(
    updateCartAction,
    initialCartActionState,
  );
  const availableVariants = variants.filter(
    (variant) => variant.availableQuantity > 0,
  );

  if (availableVariants.length === 0) {
    return <p className="action-feedback">Currently unavailable.</p>;
  }

  return (
    <form action={action}>
      <div className="variant-picker">
        <label htmlFor="variantId">Finish / configuration</label>
        <select
          defaultValue={availableVariants[0]?.id}
          id="variantId"
          name="variantId"
        >
          {variants.map((variant) => (
            <option
              disabled={variant.availableQuantity === 0}
              key={variant.id}
              value={variant.id}
            >
              {variant.name}
              {variant.availableQuantity === 0 ? " - unavailable" : ""}
            </option>
          ))}
        </select>
      </div>
      <span className="quantity-label">Quantity</span>
      <div className="add-to-cart-form">
        <input
          aria-label="Quantity"
          defaultValue="1"
          max="9"
          min="1"
          name="quantity"
          type="number"
        />
        <button
          className="button button-primary"
          disabled={pending}
          type="submit"
        >
          {pending ? "Updating..." : "Set cart quantity"}
        </button>
        <p aria-live="polite" className="action-feedback">
          {state.message}
        </p>
      </div>
    </form>
  );
}

function QuantityButton({
  label,
  quantity,
  variantId,
}: {
  label: string;
  quantity: number;
  variantId: string;
}) {
  const [state, action, pending] = useActionState(
    updateCartAction,
    initialCartActionState,
  );

  return (
    <form action={action}>
      <input name="variantId" type="hidden" value={variantId} />
      <input name="quantity" type="hidden" value={quantity} />
      <button
        aria-label={label}
        disabled={pending}
        title={state.ok ? state.message : undefined}
        type="submit"
      >
        {quantity === 0 || label.toLowerCase().includes("decrease") ? (
          <MinusIcon />
        ) : (
          <PlusIcon />
        )}
      </button>
      <span aria-live="polite" className="sr-only">
        {state.message}
      </span>
    </form>
  );
}

export function CartQuantityControl({
  name,
  quantity,
  variantId,
}: {
  name: string;
  quantity: number;
  variantId: string;
}) {
  return (
    <div className="quantity-control">
      <QuantityButton
        label={quantity === 1 ? `Remove ${name}` : `Decrease ${name} quantity`}
        quantity={Math.max(0, quantity - 1)}
        variantId={variantId}
      />
      <span aria-label={`Quantity ${quantity}`}>{quantity}</span>
      <QuantityButton
        label={`Increase ${name} quantity`}
        quantity={quantity + 1}
        variantId={variantId}
      />
    </div>
  );
}
