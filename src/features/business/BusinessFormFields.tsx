import type { Ref } from 'react';
import { Controller, useController, useWatch } from 'react-hook-form';
import type { Control, FieldPath, UseFormSetValue } from 'react-hook-form';
import { TextInput, View } from 'react-native';
import type { KeyboardTypeOptions } from 'react-native';

import { Card, Input, SegmentedControl, Text } from '@/components/ui';
import { formatDocument } from '@/utils/documents';
import type { BusinessFormData } from './schemas';

export type BusinessFormSection =
  'all' | 'business' | 'contact' | 'address' | 'details';

export type BusinessFocusField =
  | 'businessName'
  | 'documentNumber'
  | 'professionalPhone'
  | 'email'
  | 'street'
  | 'number'
  | 'neighborhood'
  | 'city'
  | 'state'
  | 'postalCode';

interface BusinessFormFieldsProps {
  control: Control<BusinessFormData>;
  setValue: UseFormSetValue<BusinessFormData>;
  disabled?: boolean;
  section?: BusinessFormSection;
  focusField?: BusinessFocusField;
  onFocusTarget?: (target: TextInput | View | null) => void;
}

interface BusinessFieldProps {
  control: Control<BusinessFormData>;
  name: FieldPath<BusinessFormData>;
  label: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
  returnKeyType?: 'next' | 'done';
  inputRef?: Ref<TextInput>;
}

function BusinessField({
  control,
  name,
  label,
  inputRef,
  ...props
}: BusinessFieldProps) {
  const { field, fieldState } = useController({ control, name });
  return (
    <Input
      {...props}
      ref={inputRef}
      error={fieldState.error?.message}
      label={label}
      onBlur={field.onBlur}
      onChangeText={field.onChange}
      value={field.value}
    />
  );
}

export function BusinessFormFields({
  control,
  setValue,
  disabled = false,
  section = 'all',
  focusField,
  onFocusTarget,
}: BusinessFormFieldsProps) {
  const documentType = useWatch({ control, name: 'documentType' });
  const show = (target: Exclude<BusinessFormSection, 'all'>) =>
    section === 'all' || section === target;

  return (
    <>
      {show('business') ? (
        <Card>
          <Text variant="cardTitle">Negócio</Text>
          <BusinessField
            control={control}
            inputRef={focusField === 'businessName' ? onFocusTarget : undefined}
            label="Nome do negócio"
            name="businessName"
            returnKeyType="next"
          />
          <Text variant="label">Tipo de documento</Text>
          <SegmentedControl
            disabled={disabled}
            label="Tipo de documento"
            onChange={(value) => {
              setValue('documentType', value);
              setValue('documentNumber', '');
            }}
            options={[
              { label: 'CPF', value: 'cpf' },
              { label: 'CNPJ', value: 'cnpj' },
            ]}
            value={documentType}
          />
          <Controller
            control={control}
            name="documentNumber"
            render={({ field, fieldState }) => (
              <Input
                ref={
                  focusField === 'documentNumber' ? onFocusTarget : undefined
                }
                error={fieldState.error?.message}
                keyboardType="number-pad"
                label={`Número do ${documentType.toUpperCase()}`}
                maxLength={documentType === 'cpf' ? 14 : 18}
                onBlur={field.onBlur}
                onChangeText={(value) =>
                  field.onChange(formatDocument(value, documentType))
                }
                returnKeyType="done"
                value={field.value}
              />
            )}
          />
        </Card>
      ) : null}

      {show('contact') ? (
        <Card>
          <Text variant="cardTitle">Contato profissional</Text>
          <BusinessField
            control={control}
            inputRef={
              focusField === 'professionalPhone' ? onFocusTarget : undefined
            }
            keyboardType="phone-pad"
            label="Telefone profissional"
            name="professionalPhone"
            returnKeyType="next"
          />
          <BusinessField
            autoCapitalize="none"
            control={control}
            inputRef={focusField === 'email' ? onFocusTarget : undefined}
            keyboardType="email-address"
            label="E-mail profissional"
            name="email"
            returnKeyType="done"
          />
        </Card>
      ) : null}

      {show('address') ? (
        <Card>
          <Text variant="cardTitle">Endereço</Text>
          <BusinessField
            control={control}
            inputRef={focusField === 'street' ? onFocusTarget : undefined}
            label="Rua"
            name="street"
            returnKeyType="next"
          />
          <BusinessField
            control={control}
            inputRef={focusField === 'number' ? onFocusTarget : undefined}
            label="Número"
            name="number"
            returnKeyType="next"
          />
          <BusinessField
            control={control}
            label="Complemento (opcional)"
            name="complement"
            returnKeyType="next"
          />
          <BusinessField
            control={control}
            inputRef={focusField === 'neighborhood' ? onFocusTarget : undefined}
            label="Bairro"
            name="neighborhood"
            returnKeyType="next"
          />
          <BusinessField
            control={control}
            inputRef={focusField === 'city' ? onFocusTarget : undefined}
            label="Cidade"
            name="city"
            returnKeyType="next"
          />
          <BusinessField
            autoCapitalize="characters"
            control={control}
            inputRef={focusField === 'state' ? onFocusTarget : undefined}
            label="Estado (UF)"
            maxLength={2}
            name="state"
            returnKeyType="next"
          />
          <BusinessField
            control={control}
            inputRef={focusField === 'postalCode' ? onFocusTarget : undefined}
            keyboardType="number-pad"
            label="CEP"
            maxLength={9}
            name="postalCode"
            returnKeyType="done"
          />
        </Card>
      ) : null}

      {show('details') ? (
        <Card>
          <Text variant="cardTitle">Detalhes opcionais</Text>
          <BusinessField
            control={control}
            label="Chave Pix"
            name="pixKey"
            returnKeyType="done"
          />
        </Card>
      ) : null}
    </>
  );
}
