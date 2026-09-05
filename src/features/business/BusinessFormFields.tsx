import { useEffect, useRef, useState } from 'react';
import type { Ref } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useController, useWatch } from 'react-hook-form';
import type { Control, FieldPath, UseFormSetValue } from 'react-hook-form';
import { ActivityIndicator, TextInput, View } from 'react-native';
import type { KeyboardTypeOptions } from 'react-native';

import { Card, Icon, Input, SegmentedControl, Text } from '@/components/ui';
import { useTheme } from '@/theme';
import { digitsOnly, formatDocument } from '@/utils/documents';
import {
  formatPostalCode,
  lookupPostalCode,
  postalCodeQueryKey,
} from './postalCode';
import { brazilianStates } from './schemas';
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
  cardVariant?: 'default' | 'elevated';
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
  cardVariant = 'default',
}: BusinessFormFieldsProps) {
  const { colors } = useTheme();
  const [postalCodeToLookup, setPostalCodeToLookup] = useState('');
  const documentType = useWatch({ control, name: 'documentType' });
  const currentPostalCode = useWatch({ control, name: 'postalCode' });
  const currentAddress = useWatch({
    control,
    name: ['street', 'neighborhood', 'city', 'state'],
  });
  const addressSnapshotRef = useRef(currentAddress);
  const appliedPostalCodeRef = useRef('');
  const postalCodeQuery = useQuery({
    queryKey: postalCodeQueryKey(postalCodeToLookup),
    queryFn: ({ signal }) => lookupPostalCode(postalCodeToLookup, signal),
    enabled: postalCodeToLookup.length === 8,
    staleTime: 24 * 60 * 60 * 1000,
    retry: false,
  });
  useEffect(() => {
    const address = postalCodeQuery.data;
    if (
      !address ||
      digitsOnly(currentPostalCode) !== postalCodeToLookup ||
      appliedPostalCodeRef.current === postalCodeToLookup
    )
      return;
    appliedPostalCodeRef.current = postalCodeToLookup;
    const snapshot = addressSnapshotRef.current;
    if (address.street && currentAddress[0] === snapshot[0])
      setValue('street', address.street, {
        shouldDirty: true,
        shouldValidate: true,
      });
    if (address.neighborhood && currentAddress[1] === snapshot[1])
      setValue('neighborhood', address.neighborhood, {
        shouldDirty: true,
        shouldValidate: true,
      });
    if (address.city && currentAddress[2] === snapshot[2])
      setValue('city', address.city, {
        shouldDirty: true,
        shouldValidate: true,
      });
    if (
      currentAddress[3] === snapshot[3] &&
      brazilianStates.includes(
        address.state as (typeof brazilianStates)[number],
      )
    )
      setValue('state', address.state as (typeof brazilianStates)[number], {
        shouldDirty: true,
        shouldValidate: true,
      });
  }, [
    currentAddress,
    currentPostalCode,
    postalCodeQuery.data,
    postalCodeToLookup,
    setValue,
  ]);
  const show = (target: Exclude<BusinessFormSection, 'all'>) =>
    section === 'all' || section === target;

  return (
    <>
      {show('business') ? (
        <Card variant={cardVariant}>
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
        <Card variant={cardVariant}>
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
        <Card variant={cardVariant}>
          <Text variant="cardTitle">Endereço</Text>
          <Controller
            control={control}
            name="postalCode"
            render={({ field, fieldState }) => {
              const lookupError = postalCodeQuery.isError
                ? postalCodeQuery.error instanceof Error &&
                  postalCodeQuery.error.message === 'POSTAL_CODE_NOT_FOUND'
                  ? 'CEP não encontrado. Você pode preencher o endereço manualmente.'
                  : 'Não foi possível consultar o CEP. Preencha manualmente ou tente novamente.'
                : undefined;
              return (
                <Input
                  ref={focusField === 'postalCode' ? onFocusTarget : undefined}
                  editable={!disabled}
                  error={fieldState.error?.message}
                  helperText={
                    lookupError ??
                    (postalCodeQuery.isSuccess
                      ? 'Endereço encontrado. Revise e complete o número.'
                      : 'Ao informar 8 dígitos, preenchemos o endereço para você.')
                  }
                  keyboardType="number-pad"
                  label="CEP"
                  maxLength={9}
                  onBlur={field.onBlur}
                  onChangeText={(value) => {
                    const formatted = formatPostalCode(value);
                    field.onChange(formatted);
                    const digits = digitsOnly(formatted);
                    const nextLookup = digits.length === 8 ? digits : '';
                    if (nextLookup) {
                      addressSnapshotRef.current = currentAddress;
                      appliedPostalCodeRef.current = '';
                    }
                    setPostalCodeToLookup(nextLookup);
                  }}
                  returnKeyType="next"
                  trailing={
                    postalCodeQuery.isFetching ? (
                      <View style={{ padding: 14 }}>
                        <ActivityIndicator
                          color={colors.primary}
                          size="small"
                        />
                      </View>
                    ) : postalCodeQuery.isSuccess ? (
                      <View style={{ padding: 14 }}>
                        <Icon color="success" name="success" size="small" />
                      </View>
                    ) : undefined
                  }
                  value={formatPostalCode(field.value)}
                />
              );
            }}
          />
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
        </Card>
      ) : null}

      {show('details') ? (
        <Card variant={cardVariant}>
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
