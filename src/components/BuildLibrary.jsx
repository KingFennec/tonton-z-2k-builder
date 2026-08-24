import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  decodeBuildPayload,
  deleteNamedBuild,
  duplicateNamedBuild,
  loadSavedBuildLibrary,
  saveNamedBuild,
} from '../engine/buildPersistence'

import './BuildLibrary.css'

function formatSavedDate(
  timestamp
) {
  if (!timestamp) {
    return ''
  }

  try {
    return new Intl.DateTimeFormat(
      'fr-FR',
      {
        dateStyle:
          'short',

        timeStyle:
          'short',
      }
    ).format(
      new Date(
        timestamp
      )
    )
  } catch {
    return ''
  }
}

function BuildLibrary({
  encodedCurrentBuild,
  attributes,
  onLoadBuild,
}) {
  const [
    open,
    setOpen,
  ] = useState(false)

  const [
    name,
    setName,
  ] = useState('')

  const [
    savedBuilds,
    setSavedBuilds,
  ] = useState(
    () =>
      loadSavedBuildLibrary()
  )

  const [
    status,
    setStatus,
  ] = useState('')

  const rootRef =
    useRef(null)

  function refreshLibrary() {
    setSavedBuilds(
      loadSavedBuildLibrary()
    )
  }

  useEffect(() => {
    if (!open) {
      return undefined
    }

    function handlePointerDown(
      event
    ) {
      if (
        rootRef.current &&
        !rootRef.current.contains(
          event.target
        )
      ) {
        setOpen(
          false
        )
      }
    }

    function handleKeyDown(
      event
    ) {
      if (
        event.key ===
        'Escape'
      ) {
        setOpen(
          false
        )
      }
    }

    document.addEventListener(
      'mousedown',
      handlePointerDown
    )

    document.addEventListener(
      'keydown',
      handleKeyDown
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handlePointerDown
      )

      document.removeEventListener(
        'keydown',
        handleKeyDown
      )
    }
  }, [
    open,
  ])

  function saveBuild() {
    const cleanName =
      name.trim()

    if (
      !cleanName ||
      !encodedCurrentBuild
    ) {
      return
    }

    const saved =
      saveNamedBuild(
        cleanName,
        encodedCurrentBuild
      )

    if (!saved) {
      setStatus(
        'Impossible d’enregistrer le build.'
      )

      return
    }

    setName(
      ''
    )

    refreshLibrary()

    setStatus(
      `« ${saved.name} » enregistré.`
    )
  }

  function loadBuild(
    savedBuild
  ) {
    const decoded =
      decodeBuildPayload(
        savedBuild.encoded,
        attributes
      )

    if (!decoded) {
      setStatus(
        'Ce build ne peut pas être chargé.'
      )

      return
    }

    onLoadBuild(
      decoded,
      savedBuild.name
    )

    setOpen(
      false
    )
  }

  function duplicateBuild(
    savedBuild
  ) {
    const duplicate =
      duplicateNamedBuild(
        savedBuild.id
      )

    if (!duplicate) {
      setStatus(
        'Impossible de dupliquer ce build.'
      )

      return
    }

    refreshLibrary()

    setStatus(
      `« ${duplicate.name} » créé.`
    )
  }

  function deleteBuild(
    savedBuild
  ) {
    const confirmed =
      window.confirm(
        `Supprimer définitivement « ${savedBuild.name} » ?`
      )

    if (!confirmed) {
      return
    }

    const deleted =
      deleteNamedBuild(
        savedBuild.id
      )

    if (!deleted) {
      setStatus(
        'Impossible de supprimer ce build.'
      )

      return
    }

    refreshLibrary()

    setStatus(
      `« ${savedBuild.name} » supprimé.`
    )
  }

  return (
    <div
      className="build-library"
      ref={
        rootRef
      }
    >
      <button
        type="button"
        className="build-share-button build-library-toggle"
        onClick={() =>
          setOpen(
            (current) =>
              !current
          )
        }
      >
        Mes builds

        <span>
          {
            savedBuilds.length
          }
        </span>
      </button>

      {open && (
        <div className="build-library-panel">
          <div className="build-library-header">
            <div>
              <strong>
                Mes builds
              </strong>

              <span>
                Sauvegardés sur cet appareil
              </span>
            </div>

            <button
              type="button"
              className="build-library-close"
              aria-label="Fermer"
              onClick={() =>
                setOpen(
                  false
                )
              }
            >
              ×
            </button>
          </div>

          <div className="build-library-save">
            <input
              type="text"
              value={
                name
              }
              maxLength={
                60
              }
              placeholder="Nom du build"
              onChange={(
                event
              ) =>
                setName(
                  event.target
                    .value
                )
              }
              onKeyDown={(
                event
              ) => {
                if (
                  event.key ===
                  'Enter'
                ) {
                  saveBuild()
                }
              }}
            />

            <button
              type="button"
              disabled={
                !name.trim() ||
                !encodedCurrentBuild
              }
              onClick={
                saveBuild
              }
            >
              Enregistrer
            </button>
          </div>

          {status && (
            <div className="build-library-status">
              {
                status
              }
            </div>
          )}

          <div className="build-library-list">
            {savedBuilds.length ===
            0 ? (
              <div className="build-library-empty">
                <strong>
                  Aucun build enregistré
                </strong>

                <span>
                  Donne un nom au build actuel pour l’ajouter ici.
                </span>
              </div>
            ) : (
              savedBuilds.map(
                (
                  savedBuild
                ) => (
                  <article
                    className="saved-build-row"
                    key={
                      savedBuild.id
                    }
                  >
                    <div className="saved-build-info">
                      <strong
                        title={
                          savedBuild.name
                        }
                      >
                        {
                          savedBuild.name
                        }
                      </strong>

                      <span>
                        {formatSavedDate(
                          savedBuild.updatedAt
                        )}
                      </span>
                    </div>

                    <div className="saved-build-actions">
                      <button
                        type="button"
                        className="saved-build-load"
                        onClick={() =>
                          loadBuild(
                            savedBuild
                          )
                        }
                      >
                        Charger
                      </button>

                      <button
                        type="button"
                        title="Dupliquer"
                        aria-label={`Dupliquer ${savedBuild.name}`}
                        onClick={() =>
                          duplicateBuild(
                            savedBuild
                          )
                        }
                      >
                        ⧉
                      </button>

                      <button
                        type="button"
                        className="saved-build-delete"
                        title="Supprimer"
                        aria-label={`Supprimer ${savedBuild.name}`}
                        onClick={() =>
                          deleteBuild(
                            savedBuild
                          )
                        }
                      >
                        ×
                      </button>
                    </div>
                  </article>
                )
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default BuildLibrary